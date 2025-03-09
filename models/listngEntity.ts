import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Listing {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  location: string;

  @Column()
  city: string;

  @Column()
  offerNo: string;

  @Column()
  chassisNo: string;

  @Column()
  carStatus: string;

  @Column()
  make: string;

  @Column()
  model: string;

  @Column()
  grade: string;

  @Column()
  modelYear: number;

  @Column()
  manufactured: string;

  @Column()
  firstRegistrationDate: Date;

  @Column()
  engineSize: string;

  @Column()
  milleage: string;

  @Column()
  seats: number;

  @Column()
  driveType: string;

  @Column()
  bodyType: string;

  @Column()
  steering: string;

  @Column()
  transmission: string;

  @Column()
  color: string;

  @Column()
  price: number;

  @Column()
  fuelType: string;

  @Column()
  name: string;

  @Column({default:null})
  slug: string;

  @Column({ type: 'enum', enum: ['Active', 'Deactive'] })
  status: 'Active' | 'Deactive';

  @Column('text', { array: true })
  photos: string[];

  @Column({ type: 'enum', enum: ['Japan', 'Thailand', 'Dubai'],default:null })
  From: 'Japan' | 'Dubai' | 'Thailand';
}
