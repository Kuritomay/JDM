import type { Car } from "../../data/cars";

export function CarInfo({ car }: { car: Car }) {
  return <aside className="car-info">
    <p>{car.manufacturer}</p>
    <h1>{car.model}<br />{car.generation}</h1>
    <p>{car.highlights.join(" · ")}</p>
  </aside>;
}
