"use client";

import type { ConnectionSuggestion } from "@linkedin-clone/shared";
import { Check, UserMinus, UserPlus, UsersRound, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useAcceptConnectionRequest,
  useNetworkOverview,
  useRejectConnectionRequest,
  useRemoveConnection,
  useSendConnectionRequest
} from "@/features/network/hooks/use-network";

export function NetworkView() {
  const { data: network } = useNetworkOverview();
  const sendRequest = useSendConnectionRequest();
  const acceptRequest = useAcceptConnectionRequest();
  const rejectRequest = useRejectConnectionRequest();
  const removeConnection = useRemoveConnection();

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>My network</CardTitle>
            <CardDescription>Grow your professional circle with relevant people.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <NetworkStat label="Connections" value={network.connectionsCount} />
            <NetworkStat label="Followers" value={network.followersCount} />
            <NetworkStat label="Pending requests" value={network.incomingRequests.length} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Network tips</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
            <p>Send a note after connecting to start a meaningful conversation.</p>
            <p>Review mutual connections to find stronger professional context.</p>
          </CardContent>
        </Card>
      </aside>

      <section className="flex min-w-0 flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Invitations</CardTitle>
            <CardDescription>Accept or ignore requests from people who want to connect.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {network.incomingRequests.length ? (
              network.incomingRequests.map((request) => (
                <PersonRow
                  key={request.id}
                  person={request.from}
                  primaryAction={{
                    label: "Accept",
                    icon: Check,
                    onClick: () => acceptRequest.mutate(request.from)
                  }}
                  secondaryAction={{
                    label: "Reject",
                    icon: X,
                    onClick: () => rejectRequest.mutate(request.from)
                  }}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No pending requests right now.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Suggested connections</CardTitle>
            <CardDescription>People you may know based on mutual connections and shared interests.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {network.suggestions.map((person) => (
              <PersonCard
                key={person.id}
                person={person}
                action={
                  person.status === "pending_sent"
                    ? {
                        label: "Pending",
                        disabled: true
                      }
                    : {
                        label: "Connect",
                        icon: UserPlus,
                        onClick: () => sendRequest.mutate(person)
                      }
                }
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your connections</CardTitle>
            <CardDescription>Manage people already in your professional network.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {network.connections.length ? (
              network.connections.map((person) => (
                <PersonRow
                  key={person.id}
                  person={person}
                  primaryAction={{
                    label: "Message",
                    icon: UsersRound,
                    onClick: () => undefined
                  }}
                  secondaryAction={{
                    label: "Remove",
                    icon: UserMinus,
                    onClick: () => removeConnection.mutate(person)
                  }}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Accepted connections will appear here.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function NetworkStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-secondary px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value.toLocaleString()}</span>
    </div>
  );
}

function PersonCard({
  person,
  action
}: {
  person: ConnectionSuggestion;
  action: {
    label: string;
    icon?: typeof UserPlus;
    disabled?: boolean;
    onClick?: () => void;
  };
}) {
  const Icon = action.icon;

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex gap-3">
        <Avatar className="size-14">
          <AvatarImage src={person.avatarUrl} />
          <AvatarFallback>{initials(person.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold">{person.name}</h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">{person.headline}</p>
        </div>
      </div>
      <ConnectionMeta person={person} />
      <Button className="mt-4 w-full" variant={action.disabled ? "secondary" : "outline"} disabled={action.disabled} onClick={action.onClick}>
        {Icon ? <Icon /> : null}
        {action.label}
      </Button>
    </div>
  );
}

function PersonRow({
  person,
  primaryAction,
  secondaryAction
}: {
  person: ConnectionSuggestion;
  primaryAction: RowAction;
  secondaryAction: RowAction;
}) {
  const PrimaryIcon = primaryAction.icon;
  const SecondaryIcon = secondaryAction.icon;

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 gap-3">
        <Avatar className="size-14">
          <AvatarImage src={person.avatarUrl} />
          <AvatarFallback>{initials(person.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{person.name}</h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">{person.headline}</p>
          <ConnectionMeta person={person} compact />
        </div>
      </div>
      <div className="flex gap-2 sm:shrink-0">
        <Button size="sm" onClick={primaryAction.onClick}>
          <PrimaryIcon /> {primaryAction.label}
        </Button>
        <Button size="sm" variant="outline" onClick={secondaryAction.onClick}>
          <SecondaryIcon /> {secondaryAction.label}
        </Button>
      </div>
    </div>
  );
}

interface RowAction {
  label: string;
  icon: typeof Check;
  onClick: () => void;
}

function ConnectionMeta({ person, compact = false }: { person: ConnectionSuggestion; compact?: boolean }) {
  return (
    <div className={compact ? "mt-2 flex flex-wrap gap-2" : "mt-4 flex flex-wrap gap-2"}>
      <Badge variant="secondary">{person.mutualConnections} mutual</Badge>
      <Badge variant="outline">{person.followersCount.toLocaleString()} followers</Badge>
      {person.location ? <Badge variant="outline">{person.location}</Badge> : null}
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
