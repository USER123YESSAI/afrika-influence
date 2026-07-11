import Image from 'next/image';

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center ${className}`}>
      <Image 
        src="/images/logo.jpg" 
        alt="Afrika Influence Hub Logo" 
        width={180} 
        height={50} 
        className="object-contain h-auto max-h-[50px] w-auto" 
        priority
      />
    </div>
  );
}