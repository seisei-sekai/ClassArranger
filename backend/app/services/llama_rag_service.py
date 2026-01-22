from typing import List
import httpx
from app.core.config import settings
from app.core.firebase import get_firestore_db
from app.core.weaviate_client import get_weaviate_client

class LlamaRAGService:
    """
    Llama RAG Service - Uses Weaviate vector database for semantic search
    
    Workflow:
    1. Indexing: When creating/updating diary entries, generate embeddings and store in Weaviate
    2. Query: When user writes new diary, search for semantically similar historical entries
    3. Generation: Use relevant historical entries as context to generate personalized recommendations
    """
    def __init__(self):
        self.ollama_url = settings.ollama_url
        self.model = settings.ollama_model
        self.db = get_firestore_db()
        self.collection_name = "diaries"
        self.weaviate_client = get_weaviate_client()
        self.weaviate_class = "DiaryEntry"

    async def generate_embedding(self, text: str) -> List[float]:
        """
        Step 1: Generate text embedding vector
        
        Uses Ollama's embedding feature to convert text into vector representation
        This enables semantic similarity search
        """
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.ollama_url}/api/embeddings",
                    json={
                        "model": self.model,
                        "prompt": text
                    }
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return result.get("embedding", [])
                else:
                    print(f"[Llama RAG] Embedding failed: {response.status_code}")
                    return []
        except Exception as e:
            print(f"[Llama RAG] Error generating embedding: {e}")
            return []

    async def index_diary(
        self,
        diary_id: str,
        user_id: str,
        title: str,
        content: str,
        created_at: str
    ):
        """
        Step 2: Index diary to Weaviate
        
        Process:
        1. Combine title and content
        2. Generate embedding vector
        3. Store in Weaviate vector database
        
        This enables subsequent semantic search
        """
        try:
            print(f"[Llama RAG] Indexing diary {diary_id}")
            
            # Combine title and content to generate embedding
            full_text = f"{title}\n\n{content}"
            embedding = await self.generate_embedding(full_text)
            
            if not embedding:
                print(f"[Llama RAG] Skip indexing - no embedding generated")
                return
            
            # Store in Weaviate
            self.weaviate_client.data_object.create(
                class_name=self.weaviate_class,
                data_object={
                    "diaryId": diary_id,
                    "userId": user_id,
                    "title": title,
                    "content": content,
                    "createdAt": created_at
                },
                vector=embedding
            )
            
            print(f"[Llama RAG] Successfully indexed diary {diary_id}")
            
        except Exception as e:
            print(f"[Llama RAG] Error indexing diary: {e}")

    async def search_similar_diaries(
        self,
        user_id: str,
        query_text: str,
        limit: int = 5
    ) -> List[dict]:
        """
        Step 3: Semantic search for similar diaries
        
        Process:
        1. Generate embedding vector for query text
        2. Search for semantically most similar diaries in Weaviate
        3. Only return diaries from the same user
        4. Sort by similarity
        
        This is the core of RAG - retrieving relevant context
        """
        try:
            print(f"[Llama RAG] Searching similar diaries for user {user_id}")
            
            # 为查询生成嵌入
            query_embedding = await self.generate_embedding(query_text)
            
            if not query_embedding:
                print(f"[Llama RAG] Skip search - no embedding generated")
                return []
            
            # 在 Weaviate 中进行向量搜索
            result = (
                self.weaviate_client.query
                .get(self.weaviate_class, ["diaryId", "title", "content", "createdAt"])
                .with_near_vector({
                    "vector": query_embedding
                })
                .with_where({
                    "path": ["userId"],
                    "operator": "Equal",
                    "valueString": user_id
                })
                .with_limit(limit)
                .do()
            )
            
            entries = result.get("data", {}).get("Get", {}).get(self.weaviate_class, [])
            print(f"[Llama RAG] Found {len(entries)} similar diaries")
            
            return entries
            
        except Exception as e:
            print(f"[Llama RAG] Error searching diaries: {e}")
            return []

    async def generate_recommendation(
        self,
        user_id: str,
        current_content: str,
        current_title: str = ""
    ) -> str:
        """
        Step 4: Generate personalized recommendation
        
        Complete RAG workflow:
        1. [Retrieval] Use Weaviate semantic search to find most relevant historical diaries
        2. [Augmented] Add relevant diaries as context to the prompt
        3. [Generation] Use Llama model to generate personalized suggestions
        
        This is the core of RAG (Retrieval-Augmented Generation)!
        """
        try:
            print(f"[Llama RAG] ====== RAG Process Starting ======")
            print(f"[Llama RAG] User ID: {user_id}")
            print(f"[Llama RAG] Current content length: {len(current_content)} characters")
            
            # ===== Step 1: Retrieval =====
            print(f"[Llama RAG] Step 1/3: Retrieving relevant diaries...")
            query_text = f"{current_title}\n\n{current_content}"
            # This returns the text fields (title, content) from Weaviate, not the vector embeddings
            similar_diaries = await self.search_similar_diaries(
                user_id=user_id,
                query_text=query_text,
                limit=3  # Take only the top 3 most relevant
            )
            
            # ===== Step 2: Augmentation =====
            print(f"[Llama RAG] Step 2/3: Building augmented context...")
            context = ""
            if similar_diaries:
                context = "User's related historical diaries (sorted by similarity):\n\n"
                for i, diary in enumerate(similar_diaries, 1):
                    context += f"[Related Diary {i}]\n"
                    context += f"Title: {diary.get('title', 'Untitled')}\n"
                    context += f"Content: {diary.get('content', '')[:300]}...\n\n"
                print(f"[Llama RAG] Found {len(similar_diaries)} related diaries")
            else:
                context = "User has no historical diaries yet, this is the first one.\n\n"
                print(f"[Llama RAG] No historical diaries, will provide general advice")
            
            # Build augmented prompt (includes retrieved context)
            prompt = f"""You are an intelligent diary assistant. Based on the user's related historical diaries and current content being written, provide helpful suggestions.

{context}

Current diary being written:
Title: {current_title}
Content: {current_content[:500]}

Please provide:
1. Brief commentary on the current content
2. Connections or thematic observations with historical diaries
3. 1-2 writing suggestions or directions for reflection

Respond in English with a warm and encouraging tone, under 150 words."""

            # ===== Step 3: Generation =====
            print(f"[Llama RAG] Step 3/3: Generating recommendation using Llama...")
            print(f"[Llama RAG] Calling Ollama API: {self.ollama_url}")
            
            # 调用 Ollama API
            async with httpx.AsyncClient(timeout=60.0) as client:
                try:
                    response = await client.post(
                        f"{self.ollama_url}/api/generate",
                        json={
                            "model": self.model,
                            "prompt": prompt,
                            "stream": False,
                            "options": {
                                "temperature": 0.7,
                                "num_predict": 200
                            }
                        }
                    )
                    
                    print(f"[Llama RAG] Response status: {response.status_code}")
                    
                    if response.status_code == 200:
                        result = response.json()
                        recommendation = result.get("response", "")
                        if recommendation:
                            print(f"[Llama RAG] Successfully generated recommendation: {len(recommendation)} characters")
                            print(f"[Llama RAG] ====== RAG Process Complete ======")
                            return recommendation
                        else:
                            error_msg = result.get("error", "Unknown error")
                            print(f"[Llama RAG] No response in result: {error_msg}")
                            return f"Ollama returned empty result. Model may not be loaded. Error: {error_msg}"
                    else:
                        error_text = response.text
                        print(f"[Llama RAG] Error response: {error_text}")
                        return f"Ollama service error (status code {response.status_code}): {error_text[:200]}"
                        
                except httpx.TimeoutException as e:
                    print(f"[Llama RAG] Timeout error: {e}")
                    return "Request timeout. Model may be loading, please try again in 30-60 seconds."
                except httpx.ConnectError as e:
                    print(f"[Llama RAG] Connection error: {e}")
                    return "Cannot connect to Ollama service. Please check if service is running: docker ps | grep ollama"
                    
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print(f"[Llama RAG] Unexpected error: {error_trace}")
            return f"Error generating recommendation: {type(e).__name__}: {str(e)}"

    async def check_ollama_status(self) -> dict:
        """Check Ollama service status"""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.ollama_url}/api/tags")
                if response.status_code == 200:
                    models = response.json().get("models", [])
                    has_model = any(self.model in m.get("name", "") for m in models)
                    return {
                        "status": "running",
                        "model_available": has_model,
                        "models": [m.get("name") for m in models]
                    }
        except Exception as e:
            return {
                "status": "offline",
                "error": str(e)
            }

