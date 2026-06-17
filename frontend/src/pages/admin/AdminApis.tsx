import { useState } from "react";
import { Plus } from "lucide-react";
import { useApis, useCreateApi } from "../../api/hooks";
import { PageHeader } from "../../components/Layout";
import { Badge, Button, Card, CardBody, Field, Input, Select, Spinner, Textarea } from "../../components/ui";

export default function AdminApis() {
  const { data: apis, isLoading } = useApis();
  const create = useCreateApi();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    displayName: "",
    description: "",
    version: "v1",
    status: "ACTIVE",
    owner: "",
    baseUrl: "",
    openApiSpecUrl: "",
    approvalMode: "MANUAL",
    published: true,
  });
  const set = (k: string) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    if (!form.name || !form.displayName) return;
    await create.mutateAsync({ ...form, tags: [] } as Parameters<typeof create.mutateAsync>[0]);
    setOpen(false);
  };

  return (
    <>
      <PageHeader
        title="APIs"
        subtitle="Publish and maintain API products."
        actions={
          <Button onClick={() => setOpen(!open)}>
            <Plus size={16} /> New API
          </Button>
        }
      />

      {open && (
        <Card className="mb-6 max-w-3xl">
          <CardBody className="grid grid-cols-2 gap-4">
            <Field label="Name (slug)">
              <Input value={form.name} onChange={set("name")} placeholder="payments-api" />
            </Field>
            <Field label="Display name">
              <Input value={form.displayName} onChange={set("displayName")} placeholder="Payments API" />
            </Field>
            <div className="col-span-2">
              <Field label="Description">
                <Textarea rows={2} value={form.description} onChange={set("description")} />
              </Field>
            </div>
            <Field label="Version">
              <Input value={form.version} onChange={set("version")} />
            </Field>
            <Field label="Owner">
              <Input value={form.owner} onChange={set("owner")} />
            </Field>
            <Field label="Base URL">
              <Input value={form.baseUrl} onChange={set("baseUrl")} placeholder="https://…/api/v1" />
            </Field>
            <Field label="OpenAPI spec URL">
              <Input value={form.openApiSpecUrl} onChange={set("openApiSpecUrl")} placeholder="https://…/openapi.json" />
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={set("status")}>
                <option value="ACTIVE">Active</option>
                <option value="BETA">Beta</option>
                <option value="DEPRECATED">Deprecated</option>
              </Select>
            </Field>
            <Field label="Approval mode">
              <Select value={form.approvalMode} onChange={set("approvalMode")}>
                <option value="MANUAL">Manual</option>
                <option value="AUTOMATIC">Automatic</option>
              </Select>
            </Field>
            <div className="col-span-2 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button disabled={create.isPending} onClick={submit}>
                Create
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {isLoading ? (
        <Spinner />
      ) : (
        <Card>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">API</th>
                <th className="px-5 py-3 font-medium">Version</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Approval</th>
                <th className="px-5 py-3 font-medium">Owner</th>
              </tr>
            </thead>
            <tbody>
              {apis?.map((a) => (
                <tr key={a.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-5 py-3 font-medium text-slate-800">{a.displayName}</td>
                  <td className="px-5 py-3 text-slate-600">{a.version}</td>
                  <td className="px-5 py-3">
                    <Badge tone={a.status}>{a.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{a.approvalMode}</td>
                  <td className="px-5 py-3 text-slate-600">{a.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
