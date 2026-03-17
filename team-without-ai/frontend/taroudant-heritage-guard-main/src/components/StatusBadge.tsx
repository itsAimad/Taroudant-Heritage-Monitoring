interface StatusBadgeProps {
  status: string;
}

const statusColors: Record<string, string> = {
  "Stable": "bg-success/10 text-success",
  "À surveiller": "bg-warning/10 text-warning",
  "Critique": "bg-critical/10 text-critical",
  "Active": "bg-critical/10 text-critical",
  "Résolue": "bg-success/10 text-success",
  "En attente": "bg-warning/10 text-warning",
  "Terminée": "bg-success/10 text-success",
  "En cours": "bg-warning/10 text-warning",
  "Planifiée": "bg-primary/10 text-primary",
  "Brouillon": "bg-muted text-muted-foreground",
  "Soumis": "bg-warning/10 text-warning",
  "Approuvé": "bg-success/10 text-success",
  "Actif": "bg-success/10 text-success",
  "Inactif": "bg-muted text-muted-foreground",
  "Info": "bg-primary/10 text-primary",
  "Warning": "bg-warning/10 text-warning",
  "Critical": "bg-critical/10 text-critical",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const color = statusColors[status] || "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium font-body ${color}`}>
      {status}
    </span>
  );
}
