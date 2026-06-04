import type { ConnectionRequest, ConnectionStatus, ConnectionSuggestion, NetworkOverview } from "@linkedin-clone/shared";
import type { NotificationUseCases } from "#src/application/notifications/notification-use-cases.js";
import type { UserRepository } from "#src/domain/repositories/user-repository.js";
import type { UserDocument } from "#src/infrastructure/database/models/user-model.js";
import { AppError } from "#src/shared/errors/app-error.js";

export class NetworkUseCases {
  constructor(private readonly users: UserRepository, private readonly notifications?: NotificationUseCases) {}

  async overview(currentUser: UserDocument): Promise<NetworkOverview> {
    const [suggestions, incomingUsers, connectionUsers] = await Promise.all([
      this.users.listSuggestions(currentUser.id, 12),
      this.users.listByIds(currentUser.receivedConnectionRequests ?? []),
      this.users.listByIds(currentUser.connections ?? [])
    ]);

    return {
      suggestions: suggestions
        .filter((user) => user.id !== currentUser.id)
        .map((user) => this.toConnectionSuggestion(user, currentUser)),
      incomingRequests: incomingUsers.map((user) => ({
        id: user.id,
        from: this.toConnectionSuggestion(user, currentUser),
        createdAt: new Date().toISOString()
      })),
      connections: connectionUsers.map((user) => this.toConnectionSuggestion(user, currentUser)),
      followersCount: currentUser.followers?.length ?? 0,
      connectionsCount: currentUser.connections?.length ?? 0
    };
  }

  async sendRequest(currentUser: UserDocument, targetUserId: string) {
    if (currentUser.id === targetUserId) {
      throw new AppError(400, "You cannot connect with yourself");
    }

    const target = await this.requireUser(targetUserId);
    if (currentUser.connections?.includes(target.id)) {
      throw new AppError(409, "You are already connected");
    }

    currentUser.sentConnectionRequests = addUnique(currentUser.sentConnectionRequests, target.id);
    currentUser.following = addUnique(currentUser.following, target.id);
    target.receivedConnectionRequests = addUnique(target.receivedConnectionRequests, currentUser.id);
    target.followers = addUnique(target.followers, currentUser.id);

    await Promise.all([this.users.save(currentUser), this.users.save(target)]);
    await this.notifications?.create({
      recipientId: target.id,
      actor: toActor(currentUser),
      type: "connection_request",
      title: `${currentUser.name} sent you a connection request`,
      body: currentUser.headline,
      entityId: currentUser.id,
      entityType: "connection",
      href: "/network"
    });
    return this.toConnectionSuggestion(target, currentUser);
  }

  async acceptRequest(currentUser: UserDocument, requesterId: string) {
    const requester = await this.requireUser(requesterId);
    if (!currentUser.receivedConnectionRequests?.includes(requester.id)) {
      throw new AppError(404, "Connection request not found");
    }

    currentUser.receivedConnectionRequests = removeValue(currentUser.receivedConnectionRequests, requester.id);
    requester.sentConnectionRequests = removeValue(requester.sentConnectionRequests, currentUser.id);
    currentUser.connections = addUnique(currentUser.connections, requester.id);
    requester.connections = addUnique(requester.connections, currentUser.id);
    currentUser.followers = addUnique(currentUser.followers, requester.id);
    requester.followers = addUnique(requester.followers, currentUser.id);
    currentUser.following = addUnique(currentUser.following, requester.id);
    requester.following = addUnique(requester.following, currentUser.id);

    await Promise.all([this.users.save(currentUser), this.users.save(requester)]);
    await this.notifications?.create({
      recipientId: requester.id,
      actor: toActor(currentUser),
      type: "connection_accepted",
      title: `${currentUser.name} accepted your connection request`,
      body: "You are now connected on ProNet.",
      entityId: currentUser.id,
      entityType: "connection",
      href: "/network"
    });
    return this.toConnectionSuggestion(requester, currentUser);
  }

  async rejectRequest(currentUser: UserDocument, requesterId: string) {
    const requester = await this.requireUser(requesterId);
    currentUser.receivedConnectionRequests = removeValue(currentUser.receivedConnectionRequests, requester.id);
    requester.sentConnectionRequests = removeValue(requester.sentConnectionRequests, currentUser.id);
    await Promise.all([this.users.save(currentUser), this.users.save(requester)]);
    return { rejected: true };
  }

  async removeConnection(currentUser: UserDocument, connectionId: string) {
    const connection = await this.requireUser(connectionId);
    currentUser.connections = removeValue(currentUser.connections, connection.id);
    connection.connections = removeValue(connection.connections, currentUser.id);
    currentUser.following = removeValue(currentUser.following, connection.id);
    connection.followers = removeValue(connection.followers, currentUser.id);
    await Promise.all([this.users.save(currentUser), this.users.save(connection)]);
    return { removed: true };
  }

  private async requireUser(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new AppError(404, "User not found");
    }

    return user;
  }

  private toConnectionSuggestion(user: UserDocument, currentUser: UserDocument): ConnectionSuggestion {
    return {
      id: user.id,
      name: user.name,
      headline: user.headline,
      avatarUrl: user.avatarUrl,
      location: user.location,
      followersCount: user.followers?.length ?? 0,
      mutualConnections: countMutual(currentUser.connections ?? [], user.connections ?? []),
      status: getStatus(currentUser, user.id)
    };
  }
}

function toActor(user: UserDocument) {
  return {
    id: user.id,
    name: user.name,
    headline: user.headline,
    avatarUrl: user.avatarUrl
  };
}

function addUnique(values: string[] = [], value: string) {
  return values.includes(value) ? values : [...values, value];
}

function removeValue(values: string[] = [], value: string) {
  return values.filter((item) => item !== value);
}

function countMutual(first: string[], second: string[]) {
  const secondSet = new Set(second);
  return first.filter((id) => secondSet.has(id)).length;
}

function getStatus(currentUser: UserDocument, userId: string): ConnectionStatus {
  if (currentUser.connections?.includes(userId)) {
    return "connected";
  }
  if (currentUser.sentConnectionRequests?.includes(userId)) {
    return "pending_sent";
  }
  if (currentUser.receivedConnectionRequests?.includes(userId)) {
    return "pending_received";
  }
  return "none";
}
