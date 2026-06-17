import { useState } from "react";
import { Check, Copy, ShieldAlert, X } from "lucide-react";
import type { ApiCredential } from "../api/types";
import { Button } from "./ui";

/** One-time reveal of a freshly minted API key (spec §4.6, §9). */
export default function CredentialDialog({
  credential,
  onClose,
}: {
  credential: ApiCredential;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (label: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <h3 className="text-lg font-semibold text-slate-900">Your API key</h3>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-600/20">
            <ShieldAlert size={18} className="mt-0.5 shrink-0" />
            <span>
              This key is shown <strong>only once</strong>. Copy it now and store it securely — you
              can rotate it later, but you cannot retrieve this value again.
            </span>
          </div>

          <Row label="API key" value={credential.apiKey} copied={copied === "key"} onCopy={() => copy("key", credential.apiKey)} mono />
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-slate-500">Header</div>
              <div className="font-mono text-slate-800">{credential.headerName}</div>
            </div>
            <div>
              <div className="text-slate-500">Gateway host</div>
              <div className="truncate font-mono text-slate-800">{credential.hostname}</div>
            </div>
          </div>

          <div>
            <div className="mb-1 text-sm text-slate-500">Try it</div>
            <pre className="overflow-x-auto rounded-lg bg-ink-900 p-3 text-xs text-emerald-200">
              {credential.curlExample}
            </pre>
            <button
              className="mt-2 inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
              onClick={() => copy("curl", credential.curlExample)}
            >
              {copied === "curl" ? <Check size={14} /> : <Copy size={14} />} copy curl
            </button>
          </div>
        </div>
        <div className="flex justify-end border-t border-slate-100 p-4">
          <Button onClick={onClose}>I've saved my key</Button>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  copied,
  onCopy,
  mono,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 text-sm text-slate-500">{label}</div>
      <div className="flex items-center gap-2">
        <code className={`flex-1 truncate rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-800 ${mono ? "font-mono" : ""}`}>
          {value}
        </code>
        <Button variant="secondary" size="sm" onClick={onCopy}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </Button>
      </div>
    </div>
  );
}
