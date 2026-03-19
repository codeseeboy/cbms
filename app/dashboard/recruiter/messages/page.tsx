"use client"

import { useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { getRecruiterChat, getRecruiterRequests, sendRecruiterChat } from "@/lib/actions/recruiter"
import type { RecruiterChatMessage, RecruiterRequest } from "@/lib/types"
import { useRealtimeQuery } from "@/lib/hooks/use-realtime-query"

export default function RecruiterMessagesPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState("")

  const queryClient = useQueryClient()
  const { data: requestsData, isFetching: requestsFetching } = useRealtimeQuery<RecruiterRequest[]>({
    queryKey: ["recruiter", "messages", "threads"],
    queryFn: () => getRecruiterRequests(),
    realtimeMs: 10_000,
    staleMs: 10_000,
  })
  const requests = requestsData || []
  const selected = requests.find((r) => r.id === selectedId) || null

  const chatQueryKey = useMemo(() => ["recruiter", "messages", "chat", selectedId || "none"] as const, [selectedId])
  const { data: messagesData, isFetching: chatFetching } = useRealtimeQuery<RecruiterChatMessage[]>({
    queryKey: chatQueryKey,
    queryFn: () => (selectedId ? getRecruiterChat(selectedId) : Promise.resolve([])),
    realtimeMs: 6_000,
    staleMs: 6_000,
  })
  const messages = messagesData || []

  const refreshMutation = useMutation({
    mutationFn: () => getRecruiterRequests(),
    onSuccess: (next) => {
      queryClient.setQueryData(["recruiter", "messages", "threads"], next)
      queryClient.invalidateQueries({ queryKey: ["recruiter", "messages"] })
    },
  })

  const sendMutation = useMutation({
    mutationFn: ({ applicationId, text }: { applicationId: string; text: string }) => sendRecruiterChat(applicationId, text),
    onSuccess: async () => {
      if (!selectedId) return
      const nextChat = await getRecruiterChat(selectedId)
      queryClient.setQueryData(chatQueryKey, nextChat)
      queryClient.invalidateQueries({ queryKey: ["recruiter", "messages"] })
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })

  function sendMessage() {
    if (!selectedId || !draft.trim()) return
    sendMutation.mutate({ applicationId: selectedId, text: draft.trim() })
    setDraft("")
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
            Recruiter Messages
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Message candidates for specific job requests.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refreshMutation.mutate()} disabled={requestsFetching || chatFetching || refreshMutation.isPending}>Refresh</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="border-border bg-card py-0 lg:col-span-2">
          <CardHeader className="pb-4 pt-6 px-6"><CardTitle className="text-foreground" style={{ fontFamily: "var(--font-heading)" }}>Request Threads</CardTitle></CardHeader>
          <CardContent className="space-y-2 px-6 pb-6">{requests.map((r) => <button key={r.id} onClick={() => setSelectedId(r.id)} className={`w-full rounded-lg border p-3 text-left ${selectedId === r.id ? "border-primary/40 bg-primary/5" : "border-border bg-secondary/20"}`}><p className="truncate text-sm font-medium text-foreground">{r.candidate?.name || "Candidate"}</p><p className="truncate text-xs text-muted-foreground">{r.job?.title}</p><div className="mt-2 flex items-center justify-between"><Badge variant="outline" className="border-border text-muted-foreground capitalize">{r.status}</Badge><span className="text-[11px] text-muted-foreground">{r.messageCount} msgs</span></div></button>)}{requests.length === 0 && <p className="text-sm text-muted-foreground">No request threads.</p>}</CardContent>
        </Card>

        <Card className="border-border bg-card py-0 lg:col-span-3">
          <CardHeader className="pb-4 pt-6 px-6"><CardTitle className="text-foreground" style={{ fontFamily: "var(--font-heading)" }}>Conversation</CardTitle></CardHeader>
          <CardContent className="px-6 pb-6">{!selected && <p className="text-sm text-muted-foreground">Select a request thread to start messaging.</p>}{selected && <div><p className="mb-3 text-xs text-muted-foreground">{selected.candidate?.name} - {selected.job?.title} ({selected.job?.company})</p><div className="mb-3 max-h-[360px] space-y-2 overflow-y-auto rounded-lg border border-border bg-secondary/20 p-3">{messages.map((m) => <div key={m.id} className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${m.senderRole === "recruiter" ? "ml-auto bg-primary text-primary-foreground" : "bg-card text-foreground"}`}><p>{m.text}</p><p className={`mt-1 text-[10px] ${m.senderRole === "recruiter" ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{m.senderName} - {new Date(m.createdAt).toLocaleString()}</p></div>)}{messages.length === 0 && <p className="text-xs text-muted-foreground">No messages yet.</p>}</div><div className="flex gap-2"><Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} className="border-border bg-secondary" placeholder="Write an update to candidate..." /><Button onClick={sendMessage} disabled={sendMutation.isPending || !draft.trim()} className="self-end bg-primary text-primary-foreground">Send</Button></div></div>}</CardContent>
        </Card>
      </div>
    </div>
  )
}
