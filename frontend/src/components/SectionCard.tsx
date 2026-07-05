type SectionCardProps = {
  title: string;
  value: string;
  subtitle?: string;
};

export default function SectionCard({ title, value, subtitle }: SectionCardProps) {
  return (
    <div className="section-card">
      <h3>{title}</h3>
      <p className="value">{value}</p>
      {subtitle && <p className="subtitle">{subtitle}</p>}
    </div>
  );
}
