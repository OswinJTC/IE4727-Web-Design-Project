// Dish photo, or a plain swatch when a dish has no image
export default function DishImage({ dish, className = 'size-14' }) {
  const shared = `${className} shrink-0 rounded-[10px]`;
  return dish.image
    ? <img className={`${shared} object-cover`} src={dish.image} alt="" />
    : <span className={`${shared} bg-peach`} />;
}
