import os
import tempfile
import aiofiles
from faster_whisper import WhisperModel

_model: WhisperModel | None = None


def get_whisper_model() -> WhisperModel:
    global _model
    if _model is None:
        # 首次加载下载模型（约1.5GB），之后从缓存读取
        _model = WhisperModel("medium", device="cpu", compute_type="int8")
    return _model


async def transcribe_audio(audio_bytes: bytes, language: str = "zh") -> str:
    """将音频字节流转换为文字"""
    model = get_whisper_model()

    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        segments, _ = model.transcribe(tmp_path, language=language, beam_size=5)
        text = "".join(seg.text for seg in segments).strip()
        return text
    finally:
        os.unlink(tmp_path)
