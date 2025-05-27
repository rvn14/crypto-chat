import ChatRoom from "@/components/ChatRoom";
import UsersList from "@/components/UsersList";


export default async function Home() {


  return (
    <div className="w-full flex flex-col items-center justify-center bg-background">
      <div className="w-full max-w-7xl flex flex-col md:flex-row gap-4 p-4">
        <div className="flex-1">
          <ChatRoom/>
        </div>
        <div className="md:w-72 w-full">
          <UsersList />
        </div>
      </div>
    </div>
  );
}
