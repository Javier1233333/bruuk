import styles from './CategorySelector.module.css';

interface CategorySelectorProps {
  categories: readonly string[];
  activeCategory: string;
  onSelect: (category: string) => void;
}

export function CategorySelector({ categories, activeCategory, onSelect }: CategorySelectorProps) {
  return (
    <div className={styles.container}>
      <div className={styles.scroll}>
        {categories.map(category => (
          <button
            key={category}
            className={`${styles.btn} ${activeCategory === category ? styles.active : ''}`}
            onClick={() => onSelect(category)}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}
