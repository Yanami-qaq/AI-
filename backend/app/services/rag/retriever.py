"""
BM25 关键词检索 RAG 服务。
无需下载大型 embedding 模型，冷启动快，适合中文技术文档检索。
"""
import os
import glob
from langchain_community.retrievers import BM25Retriever
from langchain.schema import Document

_KNOWLEDGE_BASE_DIR = os.path.join(os.path.dirname(__file__), "../../../knowledge_base")
_retrievers: dict[str, BM25Retriever] = {}


def _load_documents(position: str) -> list[Document]:
    pos_dir = os.path.join(_KNOWLEDGE_BASE_DIR, position)
    docs: list[Document] = []
    for filepath in glob.glob(os.path.join(pos_dir, "**", "*.md"), recursive=True):
        with open(filepath, encoding="utf-8") as f:
            content = f.read()
        # 按段落切分，过滤空块
        chunks = [c.strip() for c in content.split("\n\n") if len(c.strip()) > 30]
        for chunk in chunks:
            docs.append(Document(page_content=chunk, metadata={"position": position}))
    return docs


def _get_retriever(position: str) -> BM25Retriever | None:
    if position not in _retrievers:
        docs = _load_documents(position)
        if not docs:
            return None
        _retrievers[position] = BM25Retriever.from_documents(docs, k=4)
    return _retrievers[position]


def retrieve_context(position: str, query: str) -> str:
    """根据候选人的回答内容，检索相关知识点片段作为 LLM 参考上下文"""
    retriever = _get_retriever(position)
    if not retriever:
        return ""
    results = retriever.invoke(query)
    return "\n---\n".join(d.page_content for d in results)


def reload_retriever(position: str) -> None:
    """知识库文档更新后调用此函数刷新索引"""
    _retrievers.pop(position, None)
    _get_retriever(position)
