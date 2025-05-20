
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { UserRole } from "@/types/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Update form schema: no password required for invitation flow
const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  role: z.enum(["super_admin", "admin", "teacher", "student"]),
});

const UserManagementPage = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      role: "student",
    },
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Get auth users
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
        
        if (authError) throw authError;
        
        // Get profiles with roles
        const { data: profiles, error: profileError } = await supabase
          .from("profiles")
          .select("*");
          
        if (profileError) throw profileError;
        
        // Combine the data
        const combinedUsers = authUsers?.users.map(user => {
          const profile = profiles?.find(p => p.id === user.id);
          return {
            id: user.id,
            email: user.email,
            role: profile?.role || "unknown",
            created_at: user.created_at,
            google_linked: profile?.google_linked || false,
          };
        });
        
        setUsers(combinedUsers || []);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({
          title: "Error",
          description: "Failed to load users. You may not have permission to view this data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [toast]);
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Invite the user with role-specific message
      const roleDisplay = values.role.replace('_', ' ');
      const appName = "Unisphere LMS";
      
      // Use the invite method instead of direct creation
      const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail({
        email: values.email,
        options: {
          data: {
            role: values.role
          },
          emailRedirectTo: `${window.location.origin}/login`,
        }
      });
      
      if (authError) throw authError;
      
      // Create profile with role
      const { error: profileError } = await supabase
        .from("profiles")
        .insert([
          {
            id: authData.user.id,
            email: values.email,
            role: values.role,
            google_linked: false,
          }
        ]);
        
      if (profileError) throw profileError;
      
      toast({
        title: "User Invited",
        description: `Successfully invited ${values.email} as ${roleDisplay}. An email has been sent with login instructions.`,
      });
      
      // Refresh user list
      const { data: updatedUsers } = await supabase
        .from("profiles")
        .select("*");
        
      setUsers(updatedUsers || []);
      setOpen(false);
      form.reset();
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to invite user",
        variant: "destructive",
      });
    }
  };

  return (
    <MainLayout requiredRole={["super_admin", "admin"]}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">User Management</h1>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Add User</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite New User</DialogTitle>
                <DialogDescription>
                  Send an invitation email to add a new user to the system.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="user@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="teacher">Teacher</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="super_admin">Super Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button type="submit">Send Invitation</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="rounded-md border">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Google</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">Loading users...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">No users found.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap capitalize">{user.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{user.google_linked ? "Linked" : "Not Linked"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button variant="outline" size="sm">Edit</Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
};

export default UserManagementPage;
