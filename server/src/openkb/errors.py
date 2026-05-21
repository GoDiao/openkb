from __future__ import annotations


class OpenKBError(Exception):
    pass


class NotFoundError(OpenKBError):
    pass


class ProjectNotFoundError(OpenKBError):
    pass


class LockConflictError(OpenKBError):
    def __init__(self, owner: str) -> None:
        self.owner = owner
        super().__init__(f"Task locked by {owner}")


class DeleteForbiddenError(OpenKBError):
    pass
