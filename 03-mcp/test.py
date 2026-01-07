import pytest
import requests
from unittest.mock import Mock, patch
from zipfile import ZipFile
from io import BytesIO
from main import count_data


def test_count_data_with_scheme():
    mock_resp = Mock()
    mock_resp.text = "Data data"
    mock_resp.raise_for_status = Mock()
    with patch("requests.get", return_value=mock_resp) as mock_get:
        result = count_data("https://example.com")
        assert result == 2
        mock_get.assert_called_once_with("https://r.jina.ai/https://example.com", timeout=15)


def test_count_data_without_scheme():
    mock_resp = Mock()
    mock_resp.text = "data"
    mock_resp.raise_for_status = Mock()
    with patch("requests.get", return_value=mock_resp) as mock_get:
        result = count_data("example.com")
        assert result == 1
        mock_get.assert_called_once_with("https://r.jina.ai/https://example.com", timeout=15)


def test_count_data_case_insensitive_and_overlapping():
    mock_resp = Mock()
    mock_resp.text = "DataDATAdata"
    mock_resp.raise_for_status = Mock()
    with patch("requests.get", return_value=mock_resp):
        result = count_data("example.com")
        assert result == 3


def test_count_data_http_error():
    mock_resp = Mock()
    mock_resp.raise_for_status = Mock(side_effect=requests.HTTPError("error"))
    with patch("requests.get", return_value=mock_resp):
        with pytest.raises(requests.HTTPError):
            count_data("https://example.com")


def download_github_data(url):
    response = requests.get(url)
    response.raise_for_status()

    zf = ZipFile(BytesIO(response.content))

    zf