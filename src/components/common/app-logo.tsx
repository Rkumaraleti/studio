import Image from "next/image";

interface AppLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export function AppLogo({
  size = 35,
  showText = true,
  className,
}: AppLogoProps) {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/qrplus_logo.png"
        alt="QR Plus Logo"
        width={size}
        height={size}
        className=""
        priority
      />
      {showText && (
        <span className={`font-bold text-2xl text-primary ${className || ""}`}>
          QR Plus
        </span>
      )}
    </div>
  );
}
