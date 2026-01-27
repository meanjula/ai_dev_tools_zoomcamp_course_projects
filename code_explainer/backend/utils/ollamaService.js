// Use global `fetch` to call the local Ollama/OpenAI-compatible HTTP API

export function validateCodeRequest(code, language) {
	if (!code || !language) {
		throw new Error("Code and language are required");
	}
}

export function buildPromptMessage(code, language) {
	return [
		{
			role: "user",
			content: `You are a senior ${language} developer and mentor.\nExplain the following ${language} code to a developer. Be accurate and concise, use Markdown formatting when useful.\nCode:\n\n\`\`\`${language}\n${code}\n\`\`\``,
		},
	];
}

export function createOllamaPayload(messages, model = "llama3") {
	return {
		model,
		messages,
		stream: true,
		temperature: 0.3,
		max_tokens: 800,
	};
}

/**
 * Create a chat completion stream using the OpenAI client (configured to talk to Ollama).
 * Returns the raw response which contains an async iterable `body` for streaming.
 */
export async function fetchOllamaStream(url, payload, extraHeaders = {}) {
	// POST to Ollama / OpenAI-compatible endpoint and return the streaming Response
	const headers = Object.assign({ "Content-Type": "application/json" }, extraHeaders || {});
	const res = await fetch(url, {
		method: "POST",
		headers,
		body: JSON.stringify(payload),
	});

	// If Ollama returned a non-OK status, read the body (if any) and throw a helpful error.
	if (!res || !res.ok) {
		let bodyText = '';
		try {
			bodyText = await res.text();
		} catch (e) {}
		const modelName = payload?.model || 'unknown';
		const serverMsg = bodyText || res?.statusText || String(res?.status);
		throw new Error(`Model '${modelName}' not available or LLM endpoint returned error: ${serverMsg}`);
	}
	return res;
}

/**
 * Process the streaming response emitted by the OpenAI client when talking to Ollama.
 * Calls `onToken` for every received text chunk and returns the accumulated text.
 */
export async function processOllamaStream(ollamaResponse, onToken) {
	const decoder = new TextDecoder();
	let buffer = "";
	let fullText = "";

	for await (const chunk of ollamaResponse.body) {
		buffer += decoder.decode(chunk, { stream: true });
		const lines = buffer.split(/\r?\n/);
		buffer = lines.pop();

		for (let raw of lines) {
			let line = raw.trim();
			if (!line) continue;

			if (line.startsWith("data: ")) line = line.replace(/^data:\s*/, "");
			if (line === "[DONE]") return fullText;

			try {
				const data = JSON.parse(line);

				if (data.choices && Array.isArray(data.choices)) {
					for (const c of data.choices) {
						const delta = c.delta || c;
						const text = delta?.content || c?.text || c?.message?.content;
						if (text) {
							fullText += text;
							onToken(text);
						}
					}
				}

				if (data.message?.content) {
					fullText += data.message.content;
					onToken(data.message.content);
				}

				if (data.done) return fullText;
			} catch (err) {
				onToken(line);
				fullText += line;
			}
		}
	}

	if (buffer) {
		const trimmed = buffer.trim();
		if (trimmed) {
			try {
				const data = JSON.parse(trimmed);
				if (data.choices && Array.isArray(data.choices)) {
					for (const c of data.choices) {
						const delta = c.delta || c;
						const text = delta?.content || c?.text || c?.message?.content;
						if (text) {
							fullText += text;
							onToken(text);
						}
					}
				} else if (data.message?.content) {
					fullText += data.message.content;
					onToken(data.message.content);
				}
			} catch {
				onToken(trimmed);
				fullText += trimmed;
			}
		}
	}

	return fullText;
}

