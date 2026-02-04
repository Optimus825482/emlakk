import PageEditorClient from "./page-editor-client";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function SayfaDuzenleyiciPage({ params }: PageProps) {
  return <PageEditorClient params={params} />;
}
