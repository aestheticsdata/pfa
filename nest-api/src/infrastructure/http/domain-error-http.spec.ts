import { toHttpException } from "@infrastructure/http/domain-error-http";
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { ConflictError, ForbiddenError, InvalidInputError, NotFoundError } from "@shared-kernel/domain-error";

describe("toHttpException", () => {
  it("answers each kind with the status the route used to throw", () => {
    expect(toHttpException(new NotFoundError("Group not found"))).toBeInstanceOf(NotFoundException);
    expect(toHttpException(new InvalidInputError("x"))).toBeInstanceOf(BadRequestException);
    expect(toHttpException(new ConflictError("x"))).toBeInstanceOf(ConflictException);
    expect(toHttpException(new ForbiddenError("x"))).toBeInstanceOf(ForbiddenException);
  });

  it("keeps the body word for word", () => {
    const translated = toHttpException(new NotFoundError("Group not found")) as NotFoundException;
    expect(translated.getResponse()).toEqual(new NotFoundException("Group not found").getResponse());
  });

  it("leaves anything else alone", () => {
    const error = new Error("boom");
    expect(toHttpException(error)).toBe(error);
  });
});
