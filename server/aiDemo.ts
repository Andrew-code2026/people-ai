import type { LlmProvider, LlmAnswer, LlmMessage, TenantContext } from "../shared/extensions";

export class DemoHRAssistant implements LlmProvider {
  readonly name = "demo-hr-assistant";
  async generateAnswer(input: { messages: LlmMessage[]; tenant: TenantContext }): Promise<LlmAnswer> {
    return { model: this.name, content: "Puedes solicitarlo desde el canal habilitado de Talento Humano. Esta respuesta pertenece a la demostración y no consulta todavía un modelo real." };
  }
}

export const demoHRAssistant = new DemoHRAssistant();
