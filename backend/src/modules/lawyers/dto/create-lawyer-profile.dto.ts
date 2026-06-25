import { Transform, Type } from 'class-transformer';
import { IsArray, IsInt, IsString, Min, MinLength } from 'class-validator';

export class CreateLawyerProfileDto {
  @IsString()
  @MinLength(2)
  fullName: string;

  @IsString()
  barCouncilNumber: string;

  @IsString()
  barCouncilState: string;

  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }: { value: unknown }): string[] =>
    Array.isArray(value)
      ? (value as string[])
      : String(value)
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean),
  )
  practiceAreas: string[];

  @Type(() => Number)
  @IsInt()
  @Min(0)
  experienceYears: number;

  @IsString()
  city: string;
}
