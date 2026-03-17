import { Inspection } from "@/lib/mock-data";
import { VulnerabilityBadge } from "@/components/VulnerabilityBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, User, AlertTriangle } from "lucide-react";

const gravityColors: Record<string, string> = {
  low: "bg-green-100 text-green-800 border-green-300",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
  high: "bg-orange-100 text-orange-800 border-orange-300",
  critical: "bg-red-100 text-red-800 border-red-300",
};

const gravityLabels: Record<string, string> = {
  low: "Faible",
  medium: "Moyen",
  high: "Élevé",
  critical: "Critique",
};

export function InspectionCard({ inspection }: { inspection: Inspection }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        {inspection.image ? (
          <img
            src={inspection.image}
            alt={`Inspection - ${inspection.monumentName}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
        {/* Overlay badges */}
        <div className="absolute top-2 left-2">
          <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-black/60 text-white">
            {inspection.inspectionType}
          </span>
        </div>
        <div className="absolute top-2 right-2">
          <VulnerabilityBadge score={inspection.vulnerabilityScore} />
        </div>
        {inspection.fissures.length > 0 && (
          <div className="absolute bottom-2 left-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-destructive/90 text-white">
              <AlertTriangle className="h-3 w-3" />
              {inspection.fissures.length} fissure{inspection.fissures.length > 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Title & Status */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-bold text-foreground leading-tight">
            {inspection.monumentName}
          </h3>
          <StatusBadge status={inspection.status} />
        </div>

        {/* Observation */}
        <p className="text-xs text-muted-foreground line-clamp-2">
          {inspection.observation}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            {inspection.inspectionDate}
          </span>
          <span className="inline-flex items-center gap-1">
            <User className="h-3 w-3" />
            {inspection.inspector}
          </span>
        </div>

        {/* Fissures list */}
        {inspection.fissures.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t">
            <p className="text-xs font-semibold text-foreground">Fissures détectées :</p>
            {inspection.fissures.map((f) => (
              <div
                key={f.id}
                className={`flex items-center justify-between text-xs px-2 py-1 rounded border ${gravityColors[f.gravityLevel]}`}
              >
                <span className="truncate mr-2">{f.description}</span>
                <span className="font-semibold whitespace-nowrap">{gravityLabels[f.gravityLevel]}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
