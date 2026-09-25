"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { Action } from "./ui";

export default function PrivateDocument({ id, label = "View evidence" }) {
  const [url, setUrl] = useState("");
  return <div className="private-document"><Action className="quiet" run={async () => {
    setUrl("");
    const result = await api(`/uploads/${id}/document`);
    if (!result.url) throw new Error("No document link was returned. Please retry.");
    setUrl(result.url);
    return "Secure link ready. Open the document below.";
  }}>{url ? "Refresh secure link" : label}</Action>{url && <a className="button quiet" href={url} target="_blank" rel="noopener noreferrer">Open document ↗</a>}</div>;
}
