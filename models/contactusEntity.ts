import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class ContactUs {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  slug: string;

  @Column({nullable:false})
  name:string

  @Column({nullable:false})
  email:string

  @Column({nullable:false})
  phoneNumber:string
}