import { plainToInstance } from "class-transformer";
import { IsNumberString, validateSync, ValidationError } from "class-validator";

class EnvironmentVariables {
  @IsNumberString()
  PORT: string;

  @IsNumberString()
  LEGACY_API_PORT: string;
}

export function validate(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = plainToInstance<EnvironmentVariables, Record<string, unknown>>(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors: ValidationError[] = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Config validation error: ${errors.toString()}`);
  }
  return validatedConfig as EnvironmentVariables;
}
