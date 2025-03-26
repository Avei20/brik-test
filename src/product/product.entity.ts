import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  @Column({ default: false })
  isDeleted: boolean;

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];
}

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  sku: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column()
  width: number;

  @Column()
  weight: number;

  @Column()
  height: number;

  @Column()
  length: number;

  @Column()
  image: string;

  @Column()
  harga: number;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  @Column({ default: false })
  isDeleted: boolean;

  @ManyToOne(() => Category, (c) => c.products)
  category: Category;
}
