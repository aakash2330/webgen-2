import Form from "next/form";
import { Button } from "@webgen/ui/components/button";
import { Input } from "@webgen/ui/components/input";
import { Plus } from "lucide-react";
import { createProject } from "@/app/api/actions/project";

export function CreateProject() {
  return (
    <Form className="flex gap-2" action={createProject}>
      <Input name="projectName" />
      <Button>
        <Plus />
      </Button>
    </Form>
  );
}
