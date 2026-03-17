import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "critical";
}

const variantClasses = {
  default: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  critical: "bg-critical/10 text-critical",
};

export function StatCard({ title, value, icon: Icon, variant = "default" }: StatCardProps) {
  return (
    <div className="bg-card border rounded-lg p-5 flex items-center gap-4">
      <div className={`rounded-lg p-3 ${variantClasses[variant]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground font-body">{title}</p>
        <p className="text-2xl font-bold font-display animate-counter">{value}</p>
      </div>
    </div>
  );
}
