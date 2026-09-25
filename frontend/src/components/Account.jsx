"use client";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import PrivateDocument from "./PrivateDocument";
import {
  useData,
  State,
  Empty,
  Heading,
  Field,
  ActionForm,
  Action,
  UploadField,
  Badge,
  date,
} from "./ui";
export function ProfilePage() {
  const { user, updateUser } = useAuth(),
    [documentId, setDocumentId] = useState(user.documentId || "");
  return (
    <>
      <Heading
        title="Put a name to the partnership."
        description="Your business profile and verification evidence."
      />
      <div className="split-layout">
        <section className="panel">
          <ActionForm
            label="Save business profile"
            onSubmit={async (form) => {
              await updateUser({
                ...Object.fromEntries(form),
                ...(documentId ? { documentId } : {}),
              });
              return "Profile saved. Changes to identity details return verification to pending.";
            }}
          >
            {[
              ["name", "Business name"],
              ["phone", "Phone"],
              ["category", "Business type"],
              ["city", "City"],
              ["address", "Address"],
              ["gstin", "GSTIN / registration number"],
            ].map(([key, label]) => (
              <Field
                key={key}
                label={label}
                name={key}
                defaultValue={user[key] || ""}
                required={["name", "phone", "city", "category"].includes(key)}
              />
            ))}
            <Field label="Account email" value={user.email} readOnly />
          </ActionForm>
        </section>
        <section className="panel" style={{ background: "#A8E6CF" }}>
          <Badge>{user.verification}</Badge>
          <h2>A little proof. A lot of trust.</h2>
          <p>
            Upload a business registration document for an administrator to
            review.
          </p>
          <UploadField
            kind="document"
            onUpload={(file) => setDocumentId(file._id)}
          />
          {documentId && (
            <>
              <p>Document uploaded. Save your profile to submit it.</p>
              <PrivateDocument key={documentId} id={documentId} label="View your document" />
            </>
          )}
          {user.verificationNote && (
            <p className="notice">Review note: {user.verificationNote}</p>
          )}
        </section>
      </div>
    </>
  );
}
export function NotificationsPage() {
  const resource = useData("/notifications");
  return (
    <>
      <Heading
        title="Stay in the loop."
        description="Requests, conversations, bookings, and saved-search alerts."
      />
      <State resource={resource}>
        {(data) =>
          data.length ? (
            <div className="stack">
              {data.map((n) => (
                <article
                  className={`panel notification ${n.readAt ? "read" : ""}`}
                  key={n._id}
                >
                  <div>
                    <Badge>{n.readAt ? "Read" : "New"}</Badge>
                    <h3>{n.title}</h3>
                    <p>{n.body}</p>
                    <small>{date(n.createdAt)}</small>
                  </div>
                  <div className="actions">
                    <Link href={n.href}>View →</Link>
                    {!n.readAt && (
                      <Action
                        className="quiet"
                        run={async () => {
                          await api(`/notifications/${n._id}/read`, {
                            method: "PATCH",
                          });
                          await resource.reload();
                        }}
                      >
                        Mark read
                      </Action>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <Empty
              title="You’re all caught up."
              text="New activity will appear here."
            />
          )
        }
      </State>
    </>
  );
}
