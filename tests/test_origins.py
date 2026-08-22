from app.core.origins import CORS_ORIGIN_REGEX, is_allowed_frontend_origin


def test_lan_and_localhost_origins_are_allowed():
    assert is_allowed_frontend_origin("http://localhost:5173")
    assert is_allowed_frontend_origin("http://127.0.0.1")
    assert is_allowed_frontend_origin("http://192.168.1.20")
    assert is_allowed_frontend_origin("http://10.0.0.8:5173")
    assert is_allowed_frontend_origin("http://172.20.10.2:5173")
    assert is_allowed_frontend_origin("https://demo.trycloudflare.com")


def test_public_and_empty_origins_are_rejected():
    assert not is_allowed_frontend_origin("")
    assert not is_allowed_frontend_origin("https://evil.example")
    assert not is_allowed_frontend_origin("http://8.8.8.8")
    assert not is_allowed_frontend_origin("https://172.16.0.8")


def test_cors_regex_covers_lan_without_wildcard():
    assert "*" not in CORS_ORIGIN_REGEX
    assert r"192\.168\." in CORS_ORIGIN_REGEX
    assert r"trycloudflare\.com" in CORS_ORIGIN_REGEX
