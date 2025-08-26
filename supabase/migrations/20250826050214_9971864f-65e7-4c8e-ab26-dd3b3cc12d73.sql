-- Create RLS policies for catalog_items table using correct enum values

-- Policy for SELECT operations
CREATE POLICY "Admin can view catalog items" ON public.catalog_items
FOR SELECT 
USING (
  public.get_current_user_role() IN ('ADMIN_PSY', 'PSY')
);

-- Policy for INSERT operations  
CREATE POLICY "Admin can create catalog items" ON public.catalog_items
FOR INSERT 
WITH CHECK (
  public.get_current_user_role() IN ('ADMIN_PSY', 'PSY')
);

-- Policy for UPDATE operations
CREATE POLICY "Admin can update catalog items" ON public.catalog_items
FOR UPDATE 
USING (
  public.get_current_user_role() IN ('ADMIN_PSY', 'PSY')
)
WITH CHECK (
  public.get_current_user_role() IN ('ADMIN_PSY', 'PSY')
);

-- Policy for DELETE operations
CREATE POLICY "Admin can delete catalog items" ON public.catalog_items
FOR DELETE 
USING (
  public.get_current_user_role() IN ('ADMIN_PSY', 'PSY')
);