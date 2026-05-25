import { CheckCheck, MoreVertical, Phone, Send, Smile } from "lucide-react";

export function WhatsAppPreview({
  templateName,
  body,
  sendTime,
  tenantName,
  approved = false
}: {
  templateName: string;
  body: string;
  sendTime: Date;
  tenantName: string;
  approved?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-emerald-900/10 bg-white shadow-panel">
      <div className="wati-surface flex items-center justify-between px-4 py-3 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-semibold">
            {tenantName.slice(0, 1)}
          </div>
          <div>
            <p className="text-sm font-semibold">{tenantName}</p>
            <p className="text-xs text-white/75">WhatsApp Business campaign preview</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-white/85">
          <Phone className="h-4 w-4" />
          <MoreVertical className="h-4 w-4" />
        </div>
      </div>
      <div className="whatsapp-wallpaper p-4">
        <div className="ml-auto max-w-[86%] rounded-lg rounded-tr-sm bg-[#dcf8c6] p-3 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-800">
            {templateName}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-900">{body}</p>
          <div className="mt-2 flex items-center justify-end gap-1 text-[11px] text-slate-500">
            {sendTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            <CheckCheck className="h-3.5 w-3.5 text-sky-500" />
          </div>
        </div>
        <div className="mt-4 rounded-full bg-white px-3 py-2 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Smile className="h-4 w-4" />
            <span className="flex-1 text-sm">
              {approved
                ? "Campaign draft is approved for Wati review"
                : "Message is preview-only until approved"}
            </span>
            <Send className="h-4 w-4 text-emerald-700" />
          </div>
        </div>
      </div>
    </div>
  );
}
