import { redirect } from "remix";
import { getSession, getUser, requireUserId } from "~/utils/session.server";
import { Role } from "@prisma/client";

export async function loader({ request }: {request: any}) {
  console.log('test')
  await getSession(
    request.headers.get("Cookie")
  );
  console.log('jsdhkfjhsdkfjhskdjhfskdjh')
  await requireUserId(request);
console.log('TESTESTST')
  const authenticatedUser = await getUser(request);
  
  if (!authenticatedUser) throw new Error("User not found");
console.log('authenticatedUser.role', authenticatedUser.role)
  if (authenticatedUser.role === Role.STUDENT) {
    console.log('authenticatedUSer - STUDENT', authenticatedUser)
    return redirect("/students");
  } else if (authenticatedUser.role === Role.TEACHER) {
    console.log('authenticatedUSer - TEACHER', authenticatedUser)
    return redirect("/teachers");
  } else {
    console.log('redirect to login...')
    return redirect("/login");
  }
}

export default function Index() {
  return (
          <div>Redirecting to your home page...</div> 
  );
}