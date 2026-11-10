/** An error with an HTTP status. Its message is safe to show the user; withSession turns it into a JSON response. */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
