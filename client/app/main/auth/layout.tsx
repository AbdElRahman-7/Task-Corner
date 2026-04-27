export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="authLayout">
      <div className="authDecoration authDecoration--1" />
      <div className="authDecoration authDecoration--2" />
      {children}
    </div>
  );
}