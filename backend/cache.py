import time
import threading

_cache: dict[str, tuple[float, object]] = {}
_lock = threading.Lock()


def get(key: str, ttl: int) -> object | None:
    with _lock:
        entry = _cache.get(key)
        if entry and (time.time() - entry[0]) < ttl:
            return entry[1]
    return None


def set(key: str, value: object):
    with _lock:
        _cache[key] = (time.time(), value)
