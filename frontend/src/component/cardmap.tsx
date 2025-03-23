interface CardProps {
    title: string;
    description: string;
  }
  
  export default function CardMap({ title, description }: CardProps) {
    return (
      <div className="bg-green-500 p-4 rounded-lg text-white">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm">{description}</p>
      </div>
    );
  }
  