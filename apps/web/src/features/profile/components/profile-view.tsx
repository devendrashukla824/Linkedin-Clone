"use client";

import type { EducationItem, ExperienceItem, UpdateProfileInput, UserProfile } from "@linkedin-clone/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import { BriefcaseBusiness, Camera, Globe, GraduationCap, Mail, MapPin, Pencil, Phone, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { DEMO_ACCESS_TOKEN, demoUser } from "@/features/auth/data/demo-user";
import { sessionQueryKey } from "@/features/auth/hooks/use-auth";
import { fetchProfile, updateProfile, uploadCoverImage, uploadProfileImage } from "@/features/profile/api/profile-api";
import { useAuthStore } from "@/stores/auth-store";

type ProfileDraft = Omit<UserProfile, "connectionsCount" | "createdAt" | "id" | "email"> & {
  email: string;
  skillsText: string;
};

export function ProfileView() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const storeUser = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const isDemo = accessToken === DEMO_ACCESS_TOKEN;
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryKey: ["profile", "me"],
    queryFn: fetchProfile,
    enabled: Boolean(accessToken && !isDemo),
    retry: false
  });

  const profile = useMemo(() => normalizeProfile(storeUser ?? profileQuery.data ?? demoUser), [profileQuery.data, storeUser]);
  const [draft, setDraft] = useState<ProfileDraft>(() => toDraft(profile));

  useEffect(() => {
    setDraft(toDraft(profile));
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updatedProfile) => {
      setUser(updatedProfile);
      queryClient.setQueryData(sessionQueryKey, updatedProfile);
      queryClient.setQueryData(["profile", "me"], updatedProfile);
      setMessage("Profile updated successfully.");
      setIsEditing(false);
    },
    onError: (error: Error) => setMessage(error.message)
  });

  const avatarMutation = useMutation({
    mutationFn: uploadProfileImage,
    onSuccess: (updatedProfile) => {
      setUser(updatedProfile);
      setMessage("Profile image updated.");
    },
    onError: (error: Error) => setMessage(error.message)
  });

  const coverMutation = useMutation({
    mutationFn: uploadCoverImage,
    onSuccess: (updatedProfile) => {
      setUser(updatedProfile);
      setMessage("Cover image updated.");
    },
    onError: (error: Error) => setMessage(error.message)
  });

  function patchDraft(update: Partial<ProfileDraft>) {
    setDraft((current) => ({ ...current, ...update }));
    setMessage(null);
  }

  function saveProfile() {
    const input: UpdateProfileInput = {
      name: draft.name,
      headline: draft.headline,
      about: draft.about,
      location: draft.location,
      company: draft.company,
      skills: draft.skillsText
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
      contact: draft.contact,
      experience: draft.experience,
      education: draft.education
    };

    if (isDemo) {
      const updatedProfile: UserProfile = {
        ...profile,
        ...input,
        skills: input.skills ?? [],
        experience: input.experience ?? [],
        education: input.education ?? [],
        contact: {
          ...draft.contact,
          email: draft.contact.email || draft.email
        }
      };
      setUser(updatedProfile);
      setMessage("Demo profile saved locally.");
      setIsEditing(false);
      return;
    }

    saveMutation.mutate(input);
  }

  async function handleImage(file: File | undefined, type: "avatar" | "cover") {
    if (!file) {
      return;
    }

    if (isDemo) {
      const dataUrl = await readFileAsDataUrl(file);
      const updatedProfile = {
        ...profile,
        [type === "avatar" ? "avatarUrl" : "coverUrl"]: dataUrl
      };
      setUser(updatedProfile);
      setMessage(`${type === "avatar" ? "Profile" : "Cover"} image updated locally.`);
      return;
    }

    if (type === "avatar") {
      avatarMutation.mutate(file);
      return;
    }

    coverMutation.mutate(file);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="flex min-w-0 flex-col gap-4">
        {message ? (
          <div className="rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground">{message}</div>
        ) : null}

        <Card className="overflow-hidden">
          <div
            className="relative h-44 bg-cover bg-center sm:h-56"
            style={{ backgroundImage: `url(${profile.coverUrl ?? demoUser.coverUrl})` }}
          >
            <Button
              type="button"
              size="sm"
              className="absolute right-4 top-4"
              onClick={() => coverInputRef.current?.click()}
            >
              <Camera /> Cover
            </Button>
            <input
              ref={coverInputRef}
              className="hidden"
              type="file"
              accept="image/*"
              onChange={(event) => handleImage(event.target.files?.[0], "cover")}
            />
          </div>
          <CardContent className="p-5">
            <div className="-mt-16 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="relative">
                  <Avatar className="size-28 border-4 border-card">
                    <AvatarImage src={profile.avatarUrl} />
                    <AvatarFallback>{initials(profile.name)}</AvatarFallback>
                  </Avatar>
                  <Button
                    type="button"
                    size="icon"
                    className="absolute bottom-1 right-1 size-9 rounded-full"
                    onClick={() => avatarInputRef.current?.click()}
                    aria-label="Upload profile image"
                  >
                    <Camera />
                  </Button>
                  <input
                    ref={avatarInputRef}
                    className="hidden"
                    type="file"
                    accept="image/*"
                    onChange={(event) => handleImage(event.target.files?.[0], "avatar")}
                  />
                </div>
                <div>
                  {isEditing ? (
                    <div className="grid gap-2">
                      <Input value={draft.name} onChange={(event) => patchDraft({ name: event.target.value })} />
                      <Input
                        value={draft.headline}
                        onChange={(event) => patchDraft({ headline: event.target.value })}
                      />
                      <Input value={draft.location ?? ""} onChange={(event) => patchDraft({ location: event.target.value })} />
                    </div>
                  ) : (
                    <>
                      <h1 className="text-2xl font-semibold">{profile.name}</h1>
                      <p className="text-base text-muted-foreground">{profile.headline}</p>
                      <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin /> {profile.location ?? "Add location"}
                      </p>
                    </>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditing((current) => !current)}>
                  <Pencil /> {isEditing ? "Cancel" : "Edit profile"}
                </Button>
                {isEditing ? (
                  <Button onClick={saveProfile} disabled={saveMutation.isPending}>
                    <Save /> Save
                  </Button>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <EditableSection title="About" description="Tell visitors what you do and what you are building.">
          {isEditing ? (
            <Textarea
              value={draft.about ?? ""}
              onChange={(event) => patchDraft({ about: event.target.value })}
              placeholder="Write a short professional summary"
            />
          ) : (
            <p className="text-sm leading-6 text-muted-foreground">{profile.about || "Add an about section."}</p>
          )}
        </EditableSection>

        <EditableSection title="Skills" description="Add comma-separated skills.">
          {isEditing ? (
            <Input
              value={draft.skillsText}
              onChange={(event) => patchDraft({ skillsText: event.target.value })}
              placeholder="React, Next.js, TypeScript"
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {profile.skills.length ? profile.skills.map((skill) => <Badge key={skill}>{skill}</Badge>) : "Add skills."}
            </div>
          )}
        </EditableSection>

        <ExperienceEditor
          isEditing={isEditing}
          items={draft.experience}
          onChange={(experience) => patchDraft({ experience })}
        />
        <EducationEditor isEditing={isEditing} items={draft.education} onChange={(education) => patchDraft({ education })} />
      </section>

      <aside className="flex flex-col gap-4">
        <EditableSection title="Contact details" description="Keep your professional contact information current.">
          {isEditing ? (
            <div className="grid gap-3">
              <Input
                value={draft.contact.email}
                onChange={(event) => patchDraft({ contact: { ...draft.contact, email: event.target.value } })}
                placeholder="Email"
              />
              <Input
                value={draft.contact.phone ?? ""}
                onChange={(event) => patchDraft({ contact: { ...draft.contact, phone: event.target.value } })}
                placeholder="Phone"
              />
              <Input
                value={draft.contact.website ?? ""}
                onChange={(event) => patchDraft({ contact: { ...draft.contact, website: event.target.value } })}
                placeholder="Website URL"
              />
              <Input
                value={draft.contact.linkedIn ?? ""}
                onChange={(event) => patchDraft({ contact: { ...draft.contact, linkedIn: event.target.value } })}
                placeholder="LinkedIn URL"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-3 text-sm text-muted-foreground">
              <ContactRow icon={Mail} text={profile.contact.email} />
              <ContactRow icon={Phone} text={profile.contact.phone || "Add phone"} />
              <ContactRow icon={Globe} text={profile.contact.website || "Add website"} />
              <ContactRow icon={MapPin} text={profile.contact.location || profile.location || "Add location"} />
            </div>
          )}
        </EditableSection>

        <Card>
          <CardHeader>
            <CardTitle>Profile strength</CardTitle>
            <CardDescription>Complete sections to make the profile presentation-ready.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            {["Profile photo", "Cover image", "About", "Experience", "Education", "Skills"].map((item) => (
              <div key={item} className="flex items-center justify-between">
                <span>{item}</span>
                <Badge variant="secondary">Added</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

function EditableSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function ExperienceEditor({
  isEditing,
  items,
  onChange
}: {
  isEditing: boolean;
  items: ExperienceItem[];
  onChange: (items: ExperienceItem[]) => void;
}) {
  return (
    <EditableSection title="Experience" description="Show current and past professional roles.">
      <div className="flex flex-col gap-4">
        {items.map((item, index) => (
          <div key={item.id} className="flex gap-3">
            <span className="mt-1 grid size-10 shrink-0 place-items-center rounded-md bg-secondary">
              <BriefcaseBusiness />
            </span>
            <div className="min-w-0 flex-1">
              {isEditing ? (
                <ProfileItemForm
                  fields={[
                    ["title", "Title"],
                    ["company", "Company"],
                    ["location", "Location"],
                    ["startDate", "Start date"],
                    ["endDate", "End date"],
                    ["description", "Description"]
                  ]}
                  item={item as unknown as ProfileItemRecord}
                  onChange={(nextItem) => onChange(replaceAt(items, index, nextItem as unknown as ExperienceItem))}
                  onDelete={() => onChange(items.filter((entry) => entry.id !== item.id))}
                />
              ) : (
                <ProfileItemRead
                  title={item.title}
                  subtitle={`${item.company}${item.location ? ` - ${item.location}` : ""}`}
                  meta={`${item.startDate}${item.endDate ? ` - ${item.endDate}` : item.isCurrent ? " - Present" : ""}`}
                  description={item.description}
                />
              )}
            </div>
          </div>
        ))}
        {isEditing ? (
          <Button variant="outline" onClick={() => onChange([...items, emptyExperience()])}>
            <Plus /> Add experience
          </Button>
        ) : null}
      </div>
    </EditableSection>
  );
}

function EducationEditor({
  isEditing,
  items,
  onChange
}: {
  isEditing: boolean;
  items: EducationItem[];
  onChange: (items: EducationItem[]) => void;
}) {
  return (
    <EditableSection title="Education" description="Add schools, degrees and learning history.">
      <div className="flex flex-col gap-4">
        {items.map((item, index) => (
          <div key={item.id} className="flex gap-3">
            <span className="mt-1 grid size-10 shrink-0 place-items-center rounded-md bg-secondary">
              <GraduationCap />
            </span>
            <div className="min-w-0 flex-1">
              {isEditing ? (
                <ProfileItemForm
                  fields={[
                    ["school", "School"],
                    ["degree", "Degree"],
                    ["field", "Field"],
                    ["startYear", "Start year"],
                    ["endYear", "End year"],
                    ["description", "Description"]
                  ]}
                  item={item as unknown as ProfileItemRecord}
                  onChange={(nextItem) => onChange(replaceAt(items, index, nextItem as unknown as EducationItem))}
                  onDelete={() => onChange(items.filter((entry) => entry.id !== item.id))}
                />
              ) : (
                <ProfileItemRead
                  title={item.school}
                  subtitle={`${item.degree}${item.field ? ` - ${item.field}` : ""}`}
                  meta={[item.startYear, item.endYear].filter(Boolean).join(" - ")}
                  description={item.description}
                />
              )}
            </div>
          </div>
        ))}
        {isEditing ? (
          <Button variant="outline" onClick={() => onChange([...items, emptyEducation()])}>
            <Plus /> Add education
          </Button>
        ) : null}
      </div>
    </EditableSection>
  );
}

type ProfileItemRecord = Record<string, string | boolean | undefined>;

function ProfileItemForm({
  fields,
  item,
  onChange,
  onDelete
}: {
  fields: Array<[string, string]>;
  item: ProfileItemRecord;
  onChange: (item: ProfileItemRecord) => void;
  onDelete: () => void;
}) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.slice(0, -1).map(([field, label]) => (
          <Input
            key={field}
            value={String(item[field] ?? "")}
            placeholder={label}
            onChange={(event) => onChange({ ...item, [field]: event.target.value })}
          />
        ))}
      </div>
      <Textarea
        value={String(item.description ?? "")}
        placeholder="Description"
        onChange={(event) => onChange({ ...item, description: event.target.value })}
      />
      <Button variant="ghost" className="justify-start text-destructive" onClick={onDelete}>
        <Trash2 /> Remove
      </Button>
      <Separator />
    </div>
  );
}

function ProfileItemRead({
  title,
  subtitle,
  meta,
  description
}: {
  title: string;
  subtitle: string;
  meta?: string;
  description?: string;
}) {
  return (
    <div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
      {meta ? <p className="mt-1 text-xs text-muted-foreground">{meta}</p> : null}
      {description ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p> : null}
    </div>
  );
}

function ContactRow({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <p className="flex items-center gap-2">
      <Icon className="shrink-0 text-muted-foreground" />
      <span className="break-all">{text}</span>
    </p>
  );
}

function toDraft(profile: UserProfile): ProfileDraft {
  return {
    name: profile.name,
    headline: profile.headline,
    email: profile.email,
    avatarUrl: profile.avatarUrl,
    coverUrl: profile.coverUrl,
    about: profile.about ?? "",
    location: profile.location ?? "",
    company: profile.company ?? "",
    skills: profile.skills ?? [],
    skillsText: (profile.skills ?? []).join(", "),
    experience: profile.experience ?? [],
    education: profile.education ?? [],
    contact: {
      email: profile.contact?.email || profile.email,
      phone: profile.contact?.phone,
      website: profile.contact?.website,
      linkedIn: profile.contact?.linkedIn,
      location: profile.contact?.location || profile.location
    }
  };
}

function normalizeProfile(profile: UserProfile): UserProfile {
  return {
    ...profile,
    skills: profile.skills ?? [],
    experience: profile.experience ?? [],
    education: profile.education ?? [],
    contact: {
      email: profile.contact?.email || profile.email,
      phone: profile.contact?.phone,
      website: profile.contact?.website,
      linkedIn: profile.contact?.linkedIn,
      location: profile.contact?.location || profile.location
    }
  };
}

function emptyExperience(): ExperienceItem {
  return {
    id: `exp-${Date.now()}`,
    title: "",
    company: "",
    startDate: "",
    isCurrent: true
  };
}

function emptyEducation(): EducationItem {
  return {
    id: `edu-${Date.now()}`,
    school: "",
    degree: ""
  };
}

function replaceAt<T>(items: T[], index: number, item: T) {
  return items.map((entry, entryIndex) => (entryIndex === index ? item : entry));
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read image file"));
    reader.readAsDataURL(file);
  });
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
