import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum Role{
    ADMIN = 'admin',
    USER = 'user'
  
}
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({nullable:false})
  name: string;

  @Column({nullable:false})
  email: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 'default.png' })
  photo?: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER,
  })
  role: Role;

  @Column({ select: false })
  password?: string;

  @Column({default:null})
  passwordResetCode: number;
}
