-- Create RLS policies for catalog_items table

-- Policy for SELECT operations
CREATE POLICY "Admin can view catalog items" ON public.catalog_items
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Policy for INSERT operations
CREATE POLICY "Admin can create catalog items" ON public.catalog_items
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Policy for UPDATE operations
CREATE POLICY "Admin can update catalog items" ON public.catalog_items
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Policy for DELETE operations
CREATE POLICY "Admin can delete catalog items" ON public.catalog_items
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);