export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      auditoria_risco: {
        Row: {
          analise_ia: Json
          atualizado_em: string
          fator_capital_desproporcional: number
          fator_clausula_restritiva: number
          fator_conluio_societario: number
          fator_empresa_fantasma: number
          fator_tempo_constituicao: number
          licitacao_id: string
          resumo_analise_ia: string
        }
        Insert: {
          analise_ia?: Json
          atualizado_em?: string
          fator_capital_desproporcional?: number
          fator_clausula_restritiva?: number
          fator_conluio_societario?: number
          fator_empresa_fantasma?: number
          fator_tempo_constituicao?: number
          licitacao_id: string
          resumo_analise_ia?: string
        }
        Update: {
          analise_ia?: Json
          atualizado_em?: string
          fator_capital_desproporcional?: number
          fator_clausula_restritiva?: number
          fator_conluio_societario?: number
          fator_empresa_fantasma?: number
          fator_tempo_constituicao?: number
          licitacao_id?: string
          resumo_analise_ia?: string
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_risco_licitacao_id_fkey"
            columns: ["licitacao_id"]
            isOneToOne: true
            referencedRelation: "licitacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          bairro: string
          capital_social: number
          cep: string
          cnae_descricao: string
          cnae_principal: string
          cnpj: string
          created_at: string
          data_abertura: string
          fachada: string
          latitude: number
          logradouro: string
          longitude: number
          municipio: string
          nome_fantasia: string | null
          numero: string
          places_estabelecimentos_raio_50m: number
          razao_social: string
          status_localizacao: string
          uf: string
        }
        Insert: {
          bairro: string
          capital_social?: number
          cep: string
          cnae_descricao: string
          cnae_principal: string
          cnpj: string
          created_at?: string
          data_abertura: string
          fachada?: string
          latitude: number
          logradouro: string
          longitude: number
          municipio: string
          nome_fantasia?: string | null
          numero: string
          places_estabelecimentos_raio_50m?: number
          razao_social: string
          status_localizacao?: string
          uf: string
        }
        Update: {
          bairro?: string
          capital_social?: number
          cep?: string
          cnae_descricao?: string
          cnae_principal?: string
          cnpj?: string
          created_at?: string
          data_abertura?: string
          fachada?: string
          latitude?: number
          logradouro?: string
          longitude?: number
          municipio?: string
          nome_fantasia?: string | null
          numero?: string
          places_estabelecimentos_raio_50m?: number
          razao_social?: string
          status_localizacao?: string
          uf?: string
        }
        Relationships: []
      }
      licitacoes: {
        Row: {
          created_at: string
          data_homologacao: string
          data_publicacao: string
          id: string
          link_edital_pdf: string
          modalidade: string
          municipio: string
          municipio_ibge: string
          numero_edital: string
          objeto: string
          orgao_comprador: string
          uf: string
          valor_estimado: number
          valor_homologado: number
        }
        Insert: {
          created_at?: string
          data_homologacao: string
          data_publicacao: string
          id: string
          link_edital_pdf: string
          modalidade: string
          municipio: string
          municipio_ibge: string
          numero_edital: string
          objeto: string
          orgao_comprador: string
          uf: string
          valor_estimado: number
          valor_homologado: number
        }
        Update: {
          created_at?: string
          data_homologacao?: string
          data_publicacao?: string
          id?: string
          link_edital_pdf?: string
          modalidade?: string
          municipio?: string
          municipio_ibge?: string
          numero_edital?: string
          objeto?: string
          orgao_comprador?: string
          uf?: string
          valor_estimado?: number
          valor_homologado?: number
        }
        Relationships: []
      }
      propostas_licitacao: {
        Row: {
          classificacao: number
          cnpj_fornecedor: string
          desconto_percentual: number
          id: string
          licitacao_id: string
          valor_proposta: number
          vencedora: boolean
        }
        Insert: {
          classificacao: number
          cnpj_fornecedor: string
          desconto_percentual?: number
          id?: string
          licitacao_id: string
          valor_proposta: number
          vencedora?: boolean
        }
        Update: {
          classificacao?: number
          cnpj_fornecedor?: string
          desconto_percentual?: number
          id?: string
          licitacao_id?: string
          valor_proposta?: number
          vencedora?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "propostas_licitacao_licitacao_id_fkey"
            columns: ["licitacao_id"]
            isOneToOne: false
            referencedRelation: "licitacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      sancoes_cgu: {
        Row: {
          ativo: boolean
          cpf_cnpj_sancionado: string
          data_fim_sancao: string | null
          data_inicio_sancao: string
          id: string
          motivo: string
          nome_sancionado: string
          orgao_sancionador: string
          tipo_sancao: string
        }
        Insert: {
          ativo?: boolean
          cpf_cnpj_sancionado: string
          data_fim_sancao?: string | null
          data_inicio_sancao: string
          id?: string
          motivo: string
          nome_sancionado: string
          orgao_sancionador: string
          tipo_sancao: string
        }
        Update: {
          ativo?: boolean
          cpf_cnpj_sancionado?: string
          data_fim_sancao?: string | null
          data_inicio_sancao?: string
          id?: string
          motivo?: string
          nome_sancionado?: string
          orgao_sancionador?: string
          tipo_sancao?: string
        }
        Relationships: []
      }
      socios: {
        Row: {
          cnpj: string
          cpf_mascarado: string
          data_entrada: string
          id: string
          nome_socio: string
          qualificacao_socio: string
        }
        Insert: {
          cnpj: string
          cpf_mascarado: string
          data_entrada: string
          id?: string
          nome_socio: string
          qualificacao_socio: string
        }
        Update: {
          cnpj?: string
          cpf_mascarado?: string
          data_entrada?: string
          id?: string
          nome_socio?: string
          qualificacao_socio?: string
        }
        Relationships: [
          {
            foreignKeyName: "socios_cnpj_fkey"
            columns: ["cnpj"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["cnpj"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
