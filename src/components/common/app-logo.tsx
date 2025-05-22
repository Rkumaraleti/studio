import type { SVGProps } from 'react';
import { QrCode } from 'lucide-react';

interface AppLogoProps extends SVGProps<SVGSVGElement> {
  size?: number;
  showText?: boolean;
}

export function AppLogo({ size = 24, showText = true, className, ...props }: AppLogoProps) {
  return (
    <div className="flex items-center gap-2">
      <QrCode className={className} size={size} color="hsl(var(--primary))" {...props} />
      {showText && (
        <span className="font-semibold text-lg text-primary">
          QR Plus
        </span>
      )}
    </div>
  );
}
