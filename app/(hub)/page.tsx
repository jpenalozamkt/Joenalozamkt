import { redirect } from "next/navigation";
import { getViewer, homePath } from "@/lib/session";

export default async function Home() {
  const v = await getViewer();
  redirect(homePath(v.profile.role));
}
