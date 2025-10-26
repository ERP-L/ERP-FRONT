import { useAppStore } from "../../app/store";
export default function ProfilePage(){
  const { session } = useAppStore();
  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold">Perfil</h1>
      <div className="card card-inner">
        <div className="text-sm">Correo: <strong>{session?.email}</strong></div>
        <div className="text-sm opacity-70">(Perfil de demo)</div>
      </div>
    </div>
  );
}
