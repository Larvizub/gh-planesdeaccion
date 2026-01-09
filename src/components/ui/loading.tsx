import { Loader2 } from "lucide-react";

export const Loading = ({ message = "Cargando..." }: { message?: string }) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 space-y-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-muted-foreground animate-pulse font-medium">{message}</p>
    </div>
  );
};

export const LoadingRow = ({ colSpan, message = "Cargando..." }: { colSpan: number; message?: string }) => {
  return (
    <tr>
      <td colSpan={colSpan} className="py-10">
        <div className="flex items-center justify-center space-x-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground font-medium">{message}</span>
        </div>
      </td>
    </tr>
  );
};
