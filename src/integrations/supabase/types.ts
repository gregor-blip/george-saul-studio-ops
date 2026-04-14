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
      benchmarks: {
        Row: {
          gs_target: number | null
          id: string
          industry_average: number | null
          kpi_name: string
          last_updated: string | null
          notes: string | null
          source: string | null
          top_performer: number | null
          unit: string
        }
        Insert: {
          gs_target?: number | null
          id?: string
          industry_average?: number | null
          kpi_name: string
          last_updated?: string | null
          notes?: string | null
          source?: string | null
          top_performer?: number | null
          unit: string
        }
        Update: {
          gs_target?: number | null
          id?: string
          industry_average?: number | null
          kpi_name?: string
          last_updated?: string | null
          notes?: string | null
          source?: string | null
          top_performer?: number | null
          unit?: string
        }
        Relationships: []
      }
      client_intelligence: {
        Row: {
          added_by: string
          category: string
          client_id: string
          created_at: string
          event_date: string | null
          id: string
          importance: string
          insight: string
          is_current: boolean
          source: string
          superseded_by: string | null
          tags: string[] | null
        }
        Insert: {
          added_by: string
          category: string
          client_id: string
          created_at?: string
          event_date?: string | null
          id?: string
          importance?: string
          insight: string
          is_current?: boolean
          source?: string
          superseded_by?: string | null
          tags?: string[] | null
        }
        Update: {
          added_by?: string
          category?: string
          client_id?: string
          created_at?: string
          event_date?: string | null
          id?: string
          importance?: string
          insight?: string
          is_current?: boolean
          source?: string
          superseded_by?: string | null
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "client_intelligence_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_intelligence_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_profitability"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "client_intelligence_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_effective_rate"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "client_intelligence_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "client_intelligence"
            referencedColumns: ["id"]
          },
        ]
      }
      client_mapping: {
        Row: {
          client_id: string
          id: string
          source: string
          source_name: string
        }
        Insert: {
          client_id: string
          id?: string
          source: string
          source_name: string
        }
        Update: {
          client_id?: string
          id?: string
          source?: string
          source_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_mapping_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_mapping_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_profitability"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "client_mapping_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_effective_rate"
            referencedColumns: ["client_id"]
          },
        ]
      }
      clients: {
        Row: {
          billing_rate: number
          business_line: string
          created_at: string
          id: string
          is_internal: boolean
          is_passthrough: boolean
          name: string
          notes: string | null
          start_date: string | null
          status: string
        }
        Insert: {
          billing_rate?: number
          business_line?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          is_passthrough?: boolean
          name: string
          notes?: string | null
          start_date?: string | null
          status?: string
        }
        Update: {
          billing_rate?: number
          business_line?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          is_passthrough?: boolean
          name?: string
          notes?: string | null
          start_date?: string | null
          status?: string
        }
        Relationships: []
      }
      employee_mapping: {
        Row: {
          employee_id: string
          id: string
          source: string
          source_name: string
        }
        Insert: {
          employee_id: string
          id?: string
          source: string
          source_name: string
        }
        Update: {
          employee_id?: string
          id?: string
          source?: string
          source_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_mapping_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_mapping_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_employee_utilisation"
            referencedColumns: ["employee_id"]
          },
        ]
      }
      employee_skills: {
        Row: {
          added_by: string
          category: string
          client_id: string | null
          confidence: string
          created_at: string
          employee_id: string
          id: string
          insight: string
          is_current: boolean
          lego_id: string | null
          proficiency: string | null
          source: string
          superseded_by: string | null
        }
        Insert: {
          added_by: string
          category: string
          client_id?: string | null
          confidence?: string
          created_at?: string
          employee_id: string
          id?: string
          insight: string
          is_current?: boolean
          lego_id?: string | null
          proficiency?: string | null
          source?: string
          superseded_by?: string | null
        }
        Update: {
          added_by?: string
          category?: string
          client_id?: string | null
          confidence?: string
          created_at?: string
          employee_id?: string
          id?: string
          insight?: string
          is_current?: boolean
          lego_id?: string | null
          proficiency?: string | null
          source?: string
          superseded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_skills_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_skills_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_profitability"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "employee_skills_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_effective_rate"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "employee_skills_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_skills_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_employee_utilisation"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "employee_skills_lego_id_fkey"
            columns: ["lego_id"]
            isOneToOne: false
            referencedRelation: "lego_catalogue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_skills_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "employee_skills"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          annual_salary: number | null
          available_hours_per_week: number
          contractor_hourly_rate: number | null
          country: string
          created_at: string
          employment_type: string
          holiday_days_per_year: number
          hourly_cost_rate: number | null
          id: string
          is_active: boolean
          is_partner: boolean
          name: string
          pto_days_per_year: number
          role: string | null
          start_date: string | null
        }
        Insert: {
          annual_salary?: number | null
          available_hours_per_week?: number
          contractor_hourly_rate?: number | null
          country?: string
          created_at?: string
          employment_type?: string
          holiday_days_per_year?: number
          hourly_cost_rate?: number | null
          id?: string
          is_active?: boolean
          is_partner?: boolean
          name: string
          pto_days_per_year?: number
          role?: string | null
          start_date?: string | null
        }
        Update: {
          annual_salary?: number | null
          available_hours_per_week?: number
          contractor_hourly_rate?: number | null
          country?: string
          created_at?: string
          employment_type?: string
          holiday_days_per_year?: number
          hourly_cost_rate?: number | null
          id?: string
          is_active?: boolean
          is_partner?: boolean
          name?: string
          pto_days_per_year?: number
          role?: string | null
          start_date?: string | null
        }
        Relationships: []
      }
      import_runs: {
        Row: {
          errors: Json | null
          file_name: string | null
          id: string
          imported_at: string
          imported_by: string | null
          row_count: number | null
          source: string
          status: string
        }
        Insert: {
          errors?: Json | null
          file_name?: string | null
          id?: string
          imported_at?: string
          imported_by?: string | null
          row_count?: number | null
          source: string
          status?: string
        }
        Update: {
          errors?: Json | null
          file_name?: string | null
          id?: string
          imported_at?: string
          imported_by?: string | null
          row_count?: number | null
          source?: string
          status?: string
        }
        Relationships: []
      }
      lego_assignments: {
        Row: {
          assigned_employee_id: string | null
          assigned_role_type: string | null
          child_lego_id: string
          created_at: string | null
          hours_override: number | null
          id: string
          notes: string | null
          parent_lego_id: string
          sort_order: number
        }
        Insert: {
          assigned_employee_id?: string | null
          assigned_role_type?: string | null
          child_lego_id: string
          created_at?: string | null
          hours_override?: number | null
          id?: string
          notes?: string | null
          parent_lego_id: string
          sort_order?: number
        }
        Update: {
          assigned_employee_id?: string | null
          assigned_role_type?: string | null
          child_lego_id?: string
          created_at?: string | null
          hours_override?: number | null
          id?: string
          notes?: string | null
          parent_lego_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "lego_assignments_assigned_employee_id_fkey"
            columns: ["assigned_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lego_assignments_assigned_employee_id_fkey"
            columns: ["assigned_employee_id"]
            isOneToOne: false
            referencedRelation: "v_employee_utilisation"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "lego_assignments_child_lego_id_fkey"
            columns: ["child_lego_id"]
            isOneToOne: false
            referencedRelation: "lego_catalogue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lego_assignments_parent_lego_id_fkey"
            columns: ["parent_lego_id"]
            isOneToOne: false
            referencedRelation: "lego_catalogue"
            referencedColumns: ["id"]
          },
        ]
      }
      lego_catalogue: {
        Row: {
          billing_label: string | null
          category: string | null
          color: string
          confidence: string
          created_at: string
          default_role_type: string | null
          description: string | null
          estimated_hours: number
          id: string
          is_active: boolean
          is_recurring: boolean
          name: string
          parent_lego_id: string | null
          recurrence_cadence: string | null
          sort_order: number
        }
        Insert: {
          billing_label?: string | null
          category?: string | null
          color?: string
          confidence?: string
          created_at?: string
          default_role_type?: string | null
          description?: string | null
          estimated_hours: number
          id?: string
          is_active?: boolean
          is_recurring?: boolean
          name: string
          parent_lego_id?: string | null
          recurrence_cadence?: string | null
          sort_order?: number
        }
        Update: {
          billing_label?: string | null
          category?: string | null
          color?: string
          confidence?: string
          created_at?: string
          default_role_type?: string | null
          description?: string | null
          estimated_hours?: number
          id?: string
          is_active?: boolean
          is_recurring?: boolean
          name?: string
          parent_lego_id?: string | null
          recurrence_cadence?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "lego_catalogue_parent_lego_id_fkey"
            columns: ["parent_lego_id"]
            isOneToOne: false
            referencedRelation: "lego_catalogue"
            referencedColumns: ["id"]
          },
        ]
      }
      monday_items: {
        Row: {
          assigned_to: string | null
          client_name_raw: string | null
          custom_fields: Json | null
          date_created: string | null
          date_updated: string | null
          id: string
          item_name: string | null
          monday_board_id: string
          monday_item_id: string
          status: string | null
          synced_at: string
        }
        Insert: {
          assigned_to?: string | null
          client_name_raw?: string | null
          custom_fields?: Json | null
          date_created?: string | null
          date_updated?: string | null
          id?: string
          item_name?: string | null
          monday_board_id: string
          monday_item_id: string
          status?: string | null
          synced_at?: string
        }
        Update: {
          assigned_to?: string | null
          client_name_raw?: string | null
          custom_fields?: Json | null
          date_created?: string | null
          date_updated?: string | null
          id?: string
          item_name?: string | null
          monday_board_id?: string
          monday_item_id?: string
          status?: string | null
          synced_at?: string
        }
        Relationships: []
      }
      pipeline: {
        Row: {
          client_id: string | null
          created_at: string
          expected_end_date: string | null
          expected_hours: number | null
          expected_revenue: number | null
          expected_start_date: string | null
          id: string
          notes: string | null
          probability: number
          project_name: string
          prospect_name: string | null
          status: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          expected_end_date?: string | null
          expected_hours?: number | null
          expected_revenue?: number | null
          expected_start_date?: string | null
          id?: string
          notes?: string | null
          probability?: number
          project_name: string
          prospect_name?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          expected_end_date?: string | null
          expected_hours?: number | null
          expected_revenue?: number | null
          expected_start_date?: string | null
          id?: string
          notes?: string | null
          probability?: number
          project_name?: string
          prospect_name?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_profitability"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "pipeline_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_effective_rate"
            referencedColumns: ["client_id"]
          },
        ]
      }
      project_retrospectives: {
        Row: {
          added_by: string
          category: string
          client_id: string
          created_at: string
          employee_ids: string[] | null
          id: string
          importance: string
          insight: string
          project_id: string | null
          source: string
        }
        Insert: {
          added_by: string
          category: string
          client_id: string
          created_at?: string
          employee_ids?: string[] | null
          id?: string
          importance?: string
          insight: string
          project_id?: string | null
          source?: string
        }
        Update: {
          added_by?: string
          category?: string
          client_id?: string
          created_at?: string
          employee_ids?: string[] | null
          id?: string
          importance?: string
          insight?: string
          project_id?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_retrospectives_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_retrospectives_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_profitability"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "project_retrospectives_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_effective_rate"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "project_retrospectives_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_retrospectives_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_burn"
            referencedColumns: ["project_id"]
          },
        ]
      }
      projects: {
        Row: {
          client_id: string
          created_at: string
          end_date: string | null
          id: string
          name: string
          scope_total_hours: number | null
          scope_total_revenue: number | null
          start_date: string | null
          status: string
        }
        Insert: {
          client_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          name: string
          scope_total_hours?: number | null
          scope_total_revenue?: number | null
          start_date?: string | null
          status?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          name?: string
          scope_total_hours?: number | null
          scope_total_revenue?: number | null
          start_date?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_profitability"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_effective_rate"
            referencedColumns: ["client_id"]
          },
        ]
      }
      qb_expenses: {
        Row: {
          account_code: string | null
          account_name: string | null
          amount: number
          category: string | null
          client_name_raw: string | null
          created_at: string
          description: string | null
          expense_date: string | null
          id: string
          import_run_id: string
          vendor: string | null
        }
        Insert: {
          account_code?: string | null
          account_name?: string | null
          amount: number
          category?: string | null
          client_name_raw?: string | null
          created_at?: string
          description?: string | null
          expense_date?: string | null
          id?: string
          import_run_id: string
          vendor?: string | null
        }
        Update: {
          account_code?: string | null
          account_name?: string | null
          amount?: number
          category?: string | null
          client_name_raw?: string | null
          created_at?: string
          description?: string | null
          expense_date?: string | null
          id?: string
          import_run_id?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qb_expenses_import_run_id_fkey"
            columns: ["import_run_id"]
            isOneToOne: false
            referencedRelation: "import_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      qb_revenue: {
        Row: {
          account_code: string | null
          account_name: string | null
          amount: number
          client_name_raw: string
          created_at: string
          id: string
          import_run_id: string
          invoice_date: string | null
          invoice_number: string | null
          payment_date: string | null
          payment_status: string | null
        }
        Insert: {
          account_code?: string | null
          account_name?: string | null
          amount: number
          client_name_raw: string
          created_at?: string
          id?: string
          import_run_id: string
          invoice_date?: string | null
          invoice_number?: string | null
          payment_date?: string | null
          payment_status?: string | null
        }
        Update: {
          account_code?: string | null
          account_name?: string | null
          amount?: number
          client_name_raw?: string
          created_at?: string
          id?: string
          import_run_id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          payment_date?: string | null
          payment_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qb_revenue_import_run_id_fkey"
            columns: ["import_run_id"]
            isOneToOne: false
            referencedRelation: "import_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_allocations: {
        Row: {
          allocated_hours: number
          assigned_by: string | null
          cadence_days: number
          cancel_reason: string | null
          cancelled_at: string | null
          client_id: string
          created_at: string
          employee_id: string
          end_date: string | null
          id: string
          lego_id: string | null
          notes: string | null
          parent_recurring_id: string | null
          project_id: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          allocated_hours: number
          assigned_by?: string | null
          cadence_days?: number
          cancel_reason?: string | null
          cancelled_at?: string | null
          client_id: string
          created_at?: string
          employee_id: string
          end_date?: string | null
          id?: string
          lego_id?: string | null
          notes?: string | null
          parent_recurring_id?: string | null
          project_id?: string | null
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          allocated_hours?: number
          assigned_by?: string | null
          cadence_days?: number
          cancel_reason?: string | null
          cancelled_at?: string | null
          client_id?: string
          created_at?: string
          employee_id?: string
          end_date?: string | null
          id?: string
          lego_id?: string | null
          notes?: string | null
          parent_recurring_id?: string | null
          project_id?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_allocations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_allocations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_profitability"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "recurring_allocations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_effective_rate"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "recurring_allocations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_allocations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_employee_utilisation"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "recurring_allocations_lego_id_fkey"
            columns: ["lego_id"]
            isOneToOne: false
            referencedRelation: "lego_catalogue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_allocations_parent_recurring_id_fkey"
            columns: ["parent_recurring_id"]
            isOneToOne: false
            referencedRelation: "recurring_allocations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_allocations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_allocations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_burn"
            referencedColumns: ["project_id"]
          },
        ]
      }
      scope_amendments: {
        Row: {
          amendment_date: string
          approved_by: string | null
          created_at: string
          hours_change: number
          id: string
          project_id: string
          reason: string | null
          revenue_change: number | null
        }
        Insert: {
          amendment_date: string
          approved_by?: string | null
          created_at?: string
          hours_change: number
          id?: string
          project_id: string
          reason?: string | null
          revenue_change?: number | null
        }
        Update: {
          amendment_date?: string
          approved_by?: string | null
          created_at?: string
          hours_change?: number
          id?: string
          project_id?: string
          reason?: string | null
          revenue_change?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scope_amendments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scope_amendments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_burn"
            referencedColumns: ["project_id"]
          },
        ]
      }
      studio_settings: {
        Row: {
          id: string
          last_updated: string
          notes: string | null
          setting_key: string
          setting_value: number
          updated_by: string | null
        }
        Insert: {
          id?: string
          last_updated?: string
          notes?: string | null
          setting_key: string
          setting_value: number
          updated_by?: string | null
        }
        Update: {
          id?: string
          last_updated?: string
          notes?: string | null
          setting_key?: string
          setting_value?: number
          updated_by?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string | null
        }
        Relationships: []
      }
      weekly_allocations: {
        Row: {
          actual_outcome: string | null
          allocated_hours: number
          assigned_by: string | null
          client_id: string
          created_at: string
          employee_id: string
          id: string
          lego_ids: string[] | null
          monday_item_id: string | null
          notes: string | null
          project_id: string | null
          recurring_allocation_id: string | null
          reviewed_at: string | null
          variance_hours: number | null
          variance_note: string | null
          week_start_date: string
        }
        Insert: {
          actual_outcome?: string | null
          allocated_hours: number
          assigned_by?: string | null
          client_id: string
          created_at?: string
          employee_id: string
          id?: string
          lego_ids?: string[] | null
          monday_item_id?: string | null
          notes?: string | null
          project_id?: string | null
          recurring_allocation_id?: string | null
          reviewed_at?: string | null
          variance_hours?: number | null
          variance_note?: string | null
          week_start_date: string
        }
        Update: {
          actual_outcome?: string | null
          allocated_hours?: number
          assigned_by?: string | null
          client_id?: string
          created_at?: string
          employee_id?: string
          id?: string
          lego_ids?: string[] | null
          monday_item_id?: string | null
          notes?: string | null
          project_id?: string | null
          recurring_allocation_id?: string | null
          reviewed_at?: string | null
          variance_hours?: number | null
          variance_note?: string | null
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_allocations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_allocations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_profitability"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "weekly_allocations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_effective_rate"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "weekly_allocations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_allocations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_employee_utilisation"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "weekly_allocations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_allocations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_burn"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "weekly_allocations_recurring_allocation_id_fkey"
            columns: ["recurring_allocation_id"]
            isOneToOne: false
            referencedRelation: "recurring_allocations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_allocation_accuracy: {
        Row: {
          accuracy_label: string | null
          actual_outcome: string | null
          allocated_hours: number | null
          client_id: string | null
          client_name: string | null
          employee_id: string | null
          employee_name: string | null
          lego_type: string | null
          reviewed_at: string | null
          variance_hours: number | null
          variance_note: string | null
          week_start_date: string | null
        }
        Relationships: [
          {
            foreignKeyName: "weekly_allocations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_allocations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_profitability"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "weekly_allocations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_effective_rate"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "weekly_allocations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_allocations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_employee_utilisation"
            referencedColumns: ["employee_id"]
          },
        ]
      }
      v_client_profitability: {
        Row: {
          billing_rate: number | null
          business_line: string | null
          client_id: string | null
          client_name: string | null
          effective_hourly_rate: number | null
          gross_margin_pct: number | null
          realisation_rate_pct: number | null
          total_allocated_cost: number | null
          total_allocated_hours: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
      v_costs_monthly: {
        Row: {
          fiscal_month: number | null
          fiscal_year: number | null
          half: string | null
          half_label: string | null
          media_spend: number | null
          month_label: string | null
          overhead_cost: number | null
          people_cost: number | null
          production_cost: number | null
          quarter_label: string | null
          quarter_number: number | null
          total_cost: number | null
        }
        Relationships: []
      }
      v_effective_rate: {
        Row: {
          below_billing_rate: boolean | null
          billing_rate: number | null
          business_line: string | null
          client_id: string | null
          client_name: string | null
          effective_hourly_rate: number | null
          realisation_rate_pct: number | null
          total_allocated_hours: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
      v_employee_utilisation: {
        Row: {
          available_hours_per_week: number | null
          billable_hours: number | null
          billable_hours_remaining: number | null
          billable_utilisation_pct: number | null
          employee_id: string | null
          employee_name: string | null
          employment_type: string | null
          hourly_cost_rate: number | null
          internal_hours: number | null
          is_partner: boolean | null
          role: string | null
          total_hours: number | null
          total_utilisation_pct: number | null
          week_start_date: string | null
        }
        Relationships: []
      }
      v_expenses_by_period: {
        Row: {
          account_code: string | null
          account_name: string | null
          amount: number | null
          business_line: string | null
          category: string | null
          client_name: string | null
          client_name_raw: string | null
          created_at: string | null
          description: string | null
          expense_date: string | null
          expense_type: string | null
          fiscal_month: number | null
          fiscal_year: number | null
          half: string | null
          half_label: string | null
          id: string | null
          import_run_id: string | null
          month_label: string | null
          quarter_label: string | null
          quarter_number: number | null
          vendor: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qb_expenses_import_run_id_fkey"
            columns: ["import_run_id"]
            isOneToOne: false
            referencedRelation: "import_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      v_forecast: {
        Row: {
          available_capacity_hours: number | null
          capacity_gap_hours: number | null
          capacity_status: string | null
          confirmed_hours_needed: number | null
          confirmed_revenue_90d: number | null
          probable_revenue: number | null
        }
        Relationships: []
      }
      v_media_monthly_total: {
        Row: {
          fiscal_month: number | null
          fiscal_year: number | null
          half: string | null
          half_label: string | null
          invoice_count: number | null
          media_billed: number | null
          media_clients: number | null
          month_label: string | null
          quarter_label: string | null
          quarter_number: number | null
        }
        Relationships: []
      }
      v_project_burn: {
        Row: {
          amendment_count: number | null
          burn_pct: number | null
          client_name: string | null
          consumed_cost: number | null
          consumed_hours: number | null
          effective_scope_hours: number | null
          effective_scope_revenue: number | null
          end_date: string | null
          hours_remaining: number | null
          is_over_scope: boolean | null
          original_scope_hours: number | null
          original_scope_revenue: number | null
          project_id: string | null
          project_name: string | null
          start_date: string | null
          status: string | null
        }
        Relationships: []
      }
      v_receivables: {
        Row: {
          amount: number | null
          client_name: string | null
          days_outstanding: number | null
          invoice_date: string | null
          invoice_number: string | null
          is_overdue: boolean | null
          payment_date: string | null
          payment_status: string | null
        }
        Relationships: []
      }
      v_revenue_by_period: {
        Row: {
          account_code: string | null
          account_name: string | null
          amount: number | null
          business_line: string | null
          client_name: string | null
          client_name_raw: string | null
          created_at: string | null
          fiscal_month: number | null
          fiscal_year: number | null
          half: string | null
          half_label: string | null
          id: string | null
          import_run_id: string | null
          invoice_date: string | null
          invoice_number: string | null
          month_label: string | null
          payment_date: string | null
          payment_status: string | null
          quarter_label: string | null
          quarter_number: number | null
          revenue_type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qb_revenue_import_run_id_fkey"
            columns: ["import_run_id"]
            isOneToOne: false
            referencedRelation: "import_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      v_revenue_monthly_total: {
        Row: {
          active_clients: number | null
          agency_revenue: number | null
          fiscal_month: number | null
          fiscal_year: number | null
          half: string | null
          half_label: string | null
          invoice_count: number | null
          month_label: string | null
          quarter_label: string | null
          quarter_number: number | null
        }
        Relationships: []
      }
      v_studio_summary: {
        Row: {
          active_headcount: number | null
          active_projects: number | null
          agency_margin_pct: number | null
          agency_revenue: number | null
          agency_revenue_per_employee: number | null
          allocations_current_week: string | null
          avg_billable_utilisation_pct: number | null
          estimated_net_income: number | null
          financials_last_imported: string | null
          media_margin_pct: number | null
          media_revenue_billed: number | null
          media_spend: number | null
          media_spread: number | null
          overhead_cost: number | null
          people_cost: number | null
          total_billed: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_client_profitability_by_period: {
        Args: { p_end?: string; p_start?: string }
        Returns: {
          billing_rate: number
          business_line: string
          client_id: string
          client_name: string
          effective_hourly_rate: number
          gross_margin_pct: number
          realisation_rate_pct: number
          total_allocated_cost: number
          total_allocated_hours: number
          total_revenue: number
        }[]
      }
      gs_setting: { Args: { key: string }; Returns: number }
      is_admin: { Args: never; Returns: boolean }
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
