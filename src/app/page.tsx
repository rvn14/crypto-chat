import ChatRoom from "@/components/ChatRoom";


export default async function Home() {


  return (
    <div className="w-full flex flex-col items-center justify-center bg-background">
      <div className="">
        <ChatRoom/>
      </div>
    </div>
  );
}
