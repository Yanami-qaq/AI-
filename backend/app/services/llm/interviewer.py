import json
from app.services.llm.client import chat_completion
from app.services.llm.prompts import (
    get_interviewer_system_prompt,
    get_evaluation_prompt,
    POSITION_LABELS,
)

INTERVIEW_END_MARKER = "[INTERVIEW_END]"


async def get_interviewer_reply(
    position: str,
    history: list[dict],
    rag_context: str = "",
) -> tuple[str, bool]:
    """
    返回 (AI回复内容, 是否结束面试)
    history 格式: [{"role": "user"/"assistant", "content": "..."}]
    """
    system = get_interviewer_system_prompt(position)
    if rag_context:
        system += f"\n\n【参考知识库】\n{rag_context}"

    messages = [{"role": "system", "content": system}] + history
    reply = await chat_completion(messages, temperature=0.6)

    is_end = INTERVIEW_END_MARKER in reply
    clean_reply = reply.replace(INTERVIEW_END_MARKER, "").strip()
    return clean_reply, is_end


async def evaluate_interview(position: str, messages: list) -> dict:
    """根据对话记录生成结构化评估报告"""
    conversation_lines = []
    for msg in messages:
        role_label = "面试官" if msg["role"] == "assistant" else "候选人"
        conversation_lines.append(f"{role_label}：{msg['content']}")
    conversation = "\n".join(conversation_lines)

    prompt = get_evaluation_prompt(position, conversation)
    result_str = await chat_completion(
        [{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=2000,
    )

    # 清理可能的 markdown 代码块
    result_str = result_str.strip()
    if result_str.startswith("```"):
        result_str = result_str.split("\n", 1)[1].rsplit("```", 1)[0]

    return json.loads(result_str)
