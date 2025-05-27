import Image from 'next/image';

interface UserCardProps {
  user: {
    id: string;
    displayName?: string;
    photoURL?: string;
    email?: string;
  };
}

export default function UserCard({ user }: UserCardProps) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary/20 transition-colors">
      <div className="h-10 w-10 rounded-full overflow-hidden bg-secondary flex items-center justify-center">
        {user.photoURL ? (
          <Image 
            src={user.photoURL} 
            alt={user.displayName || 'User'} 
            width={40}
            height={40}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-lg font-medium text-secondary-foreground">
            {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
          </span>
        )}
      </div>
      <div>
        <p className="font-medium">{user.displayName || user.email || 'Anonymous User'}</p>
      </div>
    </div>
  );
}
