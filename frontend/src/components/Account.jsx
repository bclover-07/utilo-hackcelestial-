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
              return "Profile saved successfully.";
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
        <section className="panel" style={{ background: "#FDFBF7", border: "2px solid #171915", boxShadow: "4px 4px 0 #171915" }}>
          <div className="section-heading" style={{ marginBottom: "1rem" }}>
            <div>
              <span className="eyebrow" style={{ color: "#0F766E" }}>ENTERPRISE COMPLIANCE</span>
              <h2 style={{ marginTop: 4 }}>Two-Tier Business Verification</h2>
            </div>
            <Badge>{user.verification || "pending"}</Badge>
          </div>
          <p style={{ fontSize: "0.9rem", color: "#555", marginBottom: "1rem" }}>
            Utlio offers two trust pathways: Instant Automated GSTIN verification or Manual Document review (utility bills, lease deeds, or incorporation certificates).
          </p>

          {/* Option A: Automated GSTIN Verification */}
          <div style={{ background: "#FFF", padding: "1rem", borderRadius: "12px", border: "1.5px solid #171915", marginBottom: "1.25rem", boxShadow: "2px 2px 0 #171915" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <strong style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span>⚡</span> Option A: Automated GSTIN Verification
              </strong>
              {user.verificationMethod === "automated_gstin" || user.gstinData ? (
                <span className="badge" style={{ background: "#A8E6CF", border: "1px solid #171915", fontSize: "0.75rem" }}>
                  ✓ Instant Verified
                </span>
              ) : (
                <span className="badge" style={{ background: "#FFE66D", border: "1px solid #171915", fontSize: "0.75rem" }}>
                  Instant Check
                </span>
              )}
            </div>
            <p style={{ fontSize: "0.85rem", color: "#666", marginBottom: "10px" }}>
              Queries the Indian GST registry in real-time to authenticate legal trade name, active tax status, and registered state jurisdiction.
            </p>
            {user.gstinData ? (
              <div style={{ background: "#F4FDF8", border: "1px solid #10B981", padding: "10px", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "10px" }}>
                <div><strong>Trade Name:</strong> {user.gstinData.tradeName}</div>
                <div><strong>Status:</strong> <span style={{ color: "#059669", fontWeight: 700 }}>● {user.gstinData.status}</span> ({user.gstinData.taxpayerType})</div>
                <div><strong>State:</strong> {user.gstinData.state} (Code: {user.gstinData.stateCode})</div>
                <div style={{ fontSize: "0.75rem", color: "#6B7280", marginTop: "4px" }}>Verified at: {new Date(user.gstinData.verifiedAt || Date.now()).toLocaleString()}</div>
              </div>
            ) : null}
            <Action
              run={async () => {
                const res = await api("/profile/verify-gstin", {
                  method: "POST",
                  body: { gstin: user.gstin },
                });
                await updateUser(res);
                return "Automated GSTIN verified successfully!";
              }}
              disabled={!user.gstin}
              style={{ width: "100%", justifyContent: "center" }}
            >
              {user.gstin ? `⚡ Run Automated GSTIN Check (${user.gstin})` : "Enter GSTIN in Profile First"}
            </Action>
          </div>

          {/* Option B: Manual Compliance Document Review */}
          <div style={{ background: "#FFF", padding: "1rem", borderRadius: "12px", border: "1.5px solid #171915", boxShadow: "2px 2px 0 #171915" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <strong style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span>📑</span> Option B: Manual Document / Utility Bill Upload
              </strong>
              {user.documentId ? (
                <span className="badge" style={{ background: "#A8E6CF", border: "1px solid #171915", fontSize: "0.75rem" }}>
                  Uploaded
                </span>
              ) : (
                <span className="badge" style={{ background: "#FAF8F5", border: "1px solid #171915", fontSize: "0.75rem" }}>
                  Optional
                </span>
              )}
            </div>
            <p style={{ fontSize: "0.85rem", color: "#666", marginBottom: "10px" }}>
              Upload property lease deed, recent commercial electricity bill, or equipment purchase invoice for manual admin approval.
            </p>
            <UploadField
              kind="document"
              onUpload={(file) => setDocumentId(file._id)}
            />
            {documentId && (
              <div style={{ marginTop: "10px" }}>
                <p className="hint">Document attached. Click "Save business profile" to submit.</p>
                <PrivateDocument key={documentId} id={documentId} label="View your attached document" />
              </div>
            )}
          </div>

          {user.verificationNote && (
            <p className="notice" style={{ marginTop: "1rem" }}>Admin Note: {user.verificationNote}</p>
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
